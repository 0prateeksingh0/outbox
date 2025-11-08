import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const accountRouter = Router();

accountRouter.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.emailAccount.findMany({
      include: {
        _count: {
          select: {
            emails: true,
            folders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Don't send passwords to client
    const sanitized = accounts.map((account) => ({
      ...account,
      password: undefined,
    }));
    
    res.json({ success: true, data: sanitized });
    
  } catch (error) {
    logger.error('Failed to fetch accounts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch accounts' 
    });
  }
});

accountRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { id: req.params.id },
      include: {
        folders: true,
        _count: {
          select: { emails: true },
        },
      },
    });
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }
    
    // Don't send password to client
    const sanitized = { ...account, password: undefined };
    
    res.json({ success: true, data: sanitized });
    
  } catch (error) {
    logger.error('Failed to fetch account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch account' 
    });
  }
});

accountRouter.get('/:id/folders', async (req: Request, res: Response) => {
  try {
    const folders = await prisma.emailFolder.findMany({
      where: { emailAccountId: req.params.id },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });
    
    res.json({ success: true, data: folders });
    
  } catch (error) {
    logger.error('Failed to fetch folders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch folders' 
    });
  }
});
