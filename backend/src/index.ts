import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { emailRouter } from './routes/email.routes';
import { accountRouter } from './routes/account.routes';
import { searchRouter } from './routes/search.routes';
import { IMAPSyncService } from './services/imap-sync.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/emails', emailRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/search', searchRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

async function startServer() {
  try {
    logger.info('Starting Onebox Email Aggregator...');

    // Initialize database connections
    await initializeDatabase();
    logger.info('✓ Database connections established');

    // Initialize Elasticsearch (optional)
    try {
      const elasticsearchService = ElasticsearchService.getInstance();
      await elasticsearchService.initialize();
      logger.info('✓ Elasticsearch initialized');
    } catch (error) {
      logger.warn('⚠ Elasticsearch not available, search features will be limited');
    }

    // Start IMAP synchronization service (optional)
    try {
      const imapService = IMAPSyncService.getInstance();
      await imapService.startSync();
      logger.info('✓ IMAP sync service started');
    } catch (error) {
      logger.warn('⚠ IMAP sync service not started, email sync will be unavailable');
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info('='.repeat(50));
      logger.info('All services are running!');
      logger.info('API Documentation: http://localhost:' + PORT + '/api/docs');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  const imapService = IMAPSyncService.getInstance();
  await imapService.stopSync();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const imapService = IMAPSyncService.getInstance();
  await imapService.stopSync();
  process.exit(0);
});

startServer();
