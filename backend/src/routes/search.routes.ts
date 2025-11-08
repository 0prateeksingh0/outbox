import { Router, Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { logger } from '../utils/logger';

export const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q: query,
      accountId,
      folderId,
      category,
      page = '1',
      limit = '20',
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;
    
    const esService = ElasticsearchService.getInstance();
    const result = await esService.searchEmails({
      query: query as string,
      accountId: accountId as string,
      folderId: folderId as string,
      category: category as string,
      from,
      size: limitNum,
    });
    
    res.json({
      success: true,
      data: result.emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    });
    
  } catch (error) {
    logger.error('Search failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed' 
    });
  }
});

searchRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    
    const esService = ElasticsearchService.getInstance();
    const stats = await esService.getEmailStats(accountId as string);
    
    res.json({ success: true, data: stats });
    
  } catch (error) {
    logger.error('Failed to fetch stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});
