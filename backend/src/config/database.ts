import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await prisma.$connect();
    logger.info('PostgreSQL connection successful');
    
    // Run any pending migrations (in development)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Checking database migrations...');
    }
    
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
