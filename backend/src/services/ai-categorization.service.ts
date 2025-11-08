// AI-powered email categorization with fallback
import { Email } from '@prisma/client';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { ElasticsearchService } from './elasticsearch.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

type EmailCategory = 
  | 'INTERESTED' 
  | 'MEETING_BOOKED' 
  | 'NOT_INTERESTED' 
  | 'SPAM' 
  | 'OUT_OF_OFFICE' 
  | 'UNCATEGORIZED';

interface CategorizationResult {
  category: EmailCategory;
  confidence: number;
  reasoning?: string;
}

export class EmailCategorizationService {
  private static instance: EmailCategorizationService;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private aiProvider: 'openai' | 'anthropic';
  
  private constructor() {
    this.aiProvider = (process.env.AI_PROVIDER as any) || 'openai';
    
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
  
  static getInstance(): EmailCategorizationService {
    if (!EmailCategorizationService.instance) {
      EmailCategorizationService.instance = new EmailCategorizationService();
    }
    return EmailCategorizationService.instance;
  }
  
  
  async categorizeEmail(email: Email): Promise<void> {
    try {
      logger.info(`Categorizing email: ${email.subject}`);
      
      const result = await this.classifyEmail(email);
      
      // Update in PostgreSQL
      await prisma.email.update({
        where: { id: email.id },
        data: {
          category: result.category,
          categoryConfidence: result.confidence,
        },
      });
      
      // Update in Elasticsearch
      const esService = ElasticsearchService.getInstance();
      await esService.updateEmail(email.id, {
        category: result.category,
      });
      
      logger.info(`✓ Categorized as: ${result.category} (${result.confidence}% confidence)`);
      
      // If email is INTERESTED, trigger notifications
      if (result.category === 'INTERESTED') {
        const notificationService = NotificationService.getInstance();
        await notificationService.notifyInterestedEmail(email);
      }
      
    } catch (error) {
      logger.error('Failed to categorize email:', error);
    }
  }
  
  
  private async classifyEmail(email: Email): Promise<CategorizationResult> {
    const prompt = this.buildCategorizationPrompt(email);
    
    if (this.aiProvider === 'openai' && this.openai) {
      return await this.classifyWithOpenAI(prompt);
    } else if (this.aiProvider === 'anthropic' && this.anthropic) {
      return await this.classifyWithAnthropic(prompt);
    } else {
      // Fallback: Basic rule-based categorization
      return this.fallbackCategorization(email);
    }
  }
  
  
  private buildCategorizationPrompt(email: Email): string {
    return `Analyze this email and categorize it into ONE of these categories:

Categories:
- INTERESTED: The sender shows interest, wants more information, or is considering the offer
- MEETING_BOOKED: A meeting has been scheduled or confirmed
- NOT_INTERESTED: Clear rejection, not interested, or asking to stop contact
- SPAM: Spam, promotional content, or irrelevant automated messages
- OUT_OF_OFFICE: Auto-reply or out-of-office message

Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}

Respond with ONLY a JSON object in this format:
{
  "category": "CATEGORY_NAME",
  "confidence": 85,
  "reasoning": "Brief explanation"
}`;
  }
  
  
  private async classifyWithOpenAI(prompt: string): Promise<CategorizationResult> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email classifier. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const result = JSON.parse(content);
    return {
      category: result.category,
      confidence: result.confidence / 100,
      reasoning: result.reasoning,
    };
  }
  
  
  private async classifyWithAnthropic(prompt: string): Promise<CategorizationResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured');
    }
    
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
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }
    
    const result = JSON.parse(content.text);
    return {
      category: result.category,
      confidence: result.confidence / 100,
      reasoning: result.reasoning,
    };
  }
  
  
  private fallbackCategorization(email: Email): CategorizationResult {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    
    // Out of office patterns
    if (
      text.includes('out of office') ||
      text.includes('automatic reply') ||
      text.includes('away from') ||
      text.includes('on vacation')
    ) {
      return { category: 'OUT_OF_OFFICE', confidence: 0.9 };
    }
    
    // Interested patterns
    if (
      text.includes('interested') ||
      text.includes('tell me more') ||
      text.includes('sounds good') ||
      text.includes('yes') ||
      text.includes('looks interesting')
    ) {
      return { category: 'INTERESTED', confidence: 0.7 };
    }
    
    // Meeting booked patterns
    if (
      text.includes('meeting scheduled') ||
      text.includes('calendar invite') ||
      text.includes('accepted the invitation') ||
      text.includes('see you on')
    ) {
      return { category: 'MEETING_BOOKED', confidence: 0.8 };
    }
    
    // Not interested patterns
    if (
      text.includes('not interested') ||
      text.includes('unsubscribe') ||
      text.includes('stop contacting') ||
      text.includes('no thank')
    ) {
      return { category: 'NOT_INTERESTED', confidence: 0.8 };
    }
    
    // Spam patterns
    if (
      text.includes('click here') ||
      text.includes('buy now') ||
      text.includes('limited offer') ||
      text.includes('act now')
    ) {
      return { category: 'SPAM', confidence: 0.6 };
    }
    
    return { category: 'UNCATEGORIZED', confidence: 0.5 };
  }
  
  
  async categorizeEmailBatch(emails: Email[]): Promise<void> {
    logger.info(`Batch categorizing ${emails.length} emails...`);
    
    for (const email of emails) {
      await this.categorizeEmail(email);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    logger.info('Batch categorization complete');
  }
}
