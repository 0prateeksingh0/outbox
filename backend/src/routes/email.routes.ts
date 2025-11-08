import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { RAGService } from '../services/rag.service';
import { EmailCategorizationService } from '../services/ai-categorization.service';
import { logger } from '../utils/logger';

export const emailRouter = Router();

emailRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      accountId,
      folderId,
      category,
      page = '1',
      limit = '20',
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    
    if (accountId) where.emailAccountId = accountId;
    if (folderId) where.folderId = folderId;
    if (category) where.category = category;
    
    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          emailAccount: {
            select: { email: true },
          },
          folder: {
            select: { name: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.email.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
    
  } catch (error) {
    logger.error('Failed to fetch emails:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch emails' 
    });
  }
});

emailRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    
    const where = accountId ? { emailAccountId: accountId as string } : {};
    
    const stats = await prisma.email.groupBy({
      by: ['category'],
      where,
      _count: true,
    });
    
    const totalEmails = await prisma.email.count({ where });
    const unreadEmails = await prisma.email.count({
      where: { ...where, isRead: false },
    });
    
    res.json({
      success: true,
      data: {
        total: totalEmails,
        unread: unreadEmails,
        byCategory: stats.reduce((acc, stat) => {
          acc[stat.category || 'UNCATEGORIZED'] = stat._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
    
  } catch (error) {
    logger.error('Failed to fetch stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});

emailRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const email = await prisma.email.findUnique({
      where: { id: req.params.id },
      include: {
        emailAccount: true,
        folder: true,
        suggestedReplies: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });
    
    if (!email) {
      return res.status(404).json({ 
        success: false, 
        error: 'Email not found' 
      });
    }
    
    res.json({ success: true, data: email });
    
  } catch (error) {
    logger.error('Failed to fetch email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch email' 
    });
  }
});

emailRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { isRead, isFlagged, isReplied } = req.body;
    
    const email = await prisma.email.update({
      where: { id: req.params.id },
      data: {
        isRead,
        isFlagged,
        isReplied,
      },
    });
    
    res.json({ success: true, data: email });
    
  } catch (error) {
    logger.error('Failed to update email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update email' 
    });
  }
});

emailRouter.post('/:id/reply-suggestions', async (req: Request, res: Response) => {
  try {
    const email = await prisma.email.findUnique({
      where: { id: req.params.id },
    });
    
    if (!email) {
      return res.status(404).json({ 
        success: false, 
        error: 'Email not found' 
      });
    }
    
    const ragService = RAGService.getInstance();
    const suggestion = await ragService.generateReplySuggestion(email);
    
    if (!suggestion) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate suggestion' 
      });
    }
    
    res.json({ success: true, data: suggestion });
    
  } catch (error) {
    logger.error('Failed to generate reply suggestion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate reply suggestion' 
    });
  }
});

emailRouter.get('/:id/reply-suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = await prisma.suggestedReply.findMany({
      where: { emailId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ success: true, data: suggestions });
    
  } catch (error) {
    logger.error('Failed to fetch suggestions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch suggestions' 
    });
  }
});

emailRouter.post('/:id/recategorize', async (req: Request, res: Response) => {
  try {
    const email = await prisma.email.findUnique({
      where: { id: req.params.id },
    });
    
    if (!email) {
      return res.status(404).json({ 
        success: false, 
        error: 'Email not found' 
      });
    }
    
    const categorizationService = EmailCategorizationService.getInstance();
    await categorizationService.categorizeEmail(email);
    
    const updated = await prisma.email.findUnique({
      where: { id: req.params.id },
    });
    
    res.json({ success: true, data: updated });
    
  } catch (error) {
    logger.error('Failed to recategorize email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to recategorize email' 
    });
  }
});
