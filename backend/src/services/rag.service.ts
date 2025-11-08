// RAG service for AI-powered reply suggestions
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Email, SuggestedReply } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface ContextChunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export class RAGService {
  private static instance: RAGService;
  private qdrantClient: QdrantClient;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private aiProvider: 'openai' | 'anthropic';
  private collectionName: string;
  
  private constructor() {
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'email_context';
    this.aiProvider = (process.env.AI_PROVIDER as any) || 'openai';
    
    // Initialize Qdrant
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    // Initialize AI provider
    if (this.aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else if (this.aiProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }
  
  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }
  
  
  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );
      
      if (!exists) {
        // Create collection with proper vector dimensions
        // OpenAI embeddings: 1536 dimensions
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        });
        
        logger.info('✓ Qdrant collection created');
        
        // Index default product context
        await this.indexProductContext();
      } else {
        logger.info('✓ Qdrant collection exists');
      }
      
    } catch (error) {
      logger.error('Failed to initialize Qdrant:', error);
      throw error;
    }
  }
  
  
  async indexProductContext(): Promise<void> {
    try {
      const contexts = await prisma.productContext.findMany({
        where: { isActive: true },
      });
      
      // If no contexts in DB, create default from env
      if (contexts.length === 0) {
        const defaultContext = await prisma.productContext.create({
          data: {
            title: 'Default Product Context',
            content: `
Product Context: ${process.env.PRODUCT_CONTEXT || 'ReachInbox - AI-powered cold outreach platform'}

Outreach Agenda: ${process.env.OUTREACH_AGENDA || 'Book a demo to see how we can help you'}

Meeting Link: Include this link when someone is interested in meeting: https://cal.com/reachinbox

Instructions:
- Be professional and friendly
- Keep responses concise
- Always include the meeting link when appropriate
- Match the tone of the received email
            `.trim(),
            isActive: true,
          },
        });
        
        contexts.push(defaultContext);
      }
      
      // Generate embeddings and store in Qdrant
      for (const context of contexts) {
        const embedding = await this.generateEmbedding(context.content);
        
        await this.qdrantClient.upsert(this.collectionName, {
          points: [
            {
              id: context.id,
              vector: embedding,
              payload: {
                title: context.title,
                content: context.content,
                createdAt: context.createdAt.toISOString(),
              },
            },
          ],
        });
        
        // Update vector ID in database
        await prisma.productContext.update({
          where: { id: context.id },
          data: { vectorId: context.id },
        });
      }
      
      logger.info(`✓ Indexed ${contexts.length} product context(s)`);
      
    } catch (error) {
      logger.error('Failed to index product context:', error);
      throw error;
    }
  }
  
  
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured for embeddings');
    }
    
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  }
  
  
  private async retrieveContext(email: Email): Promise<ContextChunk[]> {
    try {
      // Generate embedding for email
      const emailText = `${email.subject}\n\n${email.body}`;
      const embedding = await this.generateEmbedding(emailText);
      
      // Search for similar context in vector database
      const searchResult = await this.qdrantClient.search(this.collectionName, {
        vector: embedding,
        limit: 3, // Get top 3 most relevant contexts
        with_payload: true,
      });
      
      return searchResult.map((result) => ({
        id: result.id as string,
        text: result.payload?.content as string,
        metadata: result.payload as Record<string, any>,
      }));
      
    } catch (error) {
      logger.error('Failed to retrieve context:', error);
      return [];
    }
  }
  
  
  async generateReplySuggestion(email: Email): Promise<SuggestedReply | null> {
    try {
      logger.info(`Generating reply suggestion for: ${email.subject}`);
      
      // Retrieve relevant context from vector database
      const contexts = await this.retrieveContext(email);
      
      if (contexts.length === 0) {
        logger.warn('No relevant context found');
        return null;
      }
      
      // Build prompt with context
      const prompt = this.buildReplyPrompt(email, contexts);
      
      // Generate reply using LLM
      const suggestion = await this.generateWithLLM(prompt);
      
      // Save suggestion to database
      const suggestedReply = await prisma.suggestedReply.create({
        data: {
          emailId: email.id,
          suggestion,
          confidence: 0.85,
          context: contexts.map((c) => c.text).join('\n\n'),
        },
      });
      
      logger.info('✓ Reply suggestion generated');
      
      return suggestedReply;
      
    } catch (error) {
      logger.error('Failed to generate reply suggestion:', error);
      return null;
    }
  }
  
  
  private buildReplyPrompt(email: Email, contexts: ContextChunk[]): string {
    const contextText = contexts.map((c) => c.text).join('\n\n---\n\n');
    
    return `You are an AI assistant helping to write professional email replies.

CONTEXT (Your knowledge about the product and agenda):
${contextText}

EMAIL RECEIVED:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}

INSTRUCTIONS:
- Write a professional, friendly reply
- Use the context information to provide relevant details
- If the email shows interest, include meeting booking link from context
- Match the tone and style of the received email
- Keep it concise (2-3 short paragraphs max)
- Be natural and human-like
- Don't mention that you're an AI

Generate ONLY the email reply text, nothing else:`;
  }
  
  
  private async generateWithLLM(prompt: string): Promise<string> {
    if (this.aiProvider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional email writer. Generate concise, friendly replies.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      return response.choices[0].message.content || '';
      
    } else if (this.aiProvider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
    }
    
    throw new Error('AI provider not configured');
  }
  
  
  async getReplySuggestions(emailId: string): Promise<SuggestedReply[]> {
    return await prisma.suggestedReply.findMany({
      where: { emailId },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  
  async regenerateReplySuggestion(emailId: string): Promise<SuggestedReply | null> {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });
    
    if (!email) {
      return null;
    }
    
    return await this.generateReplySuggestion(email);
  }
}
