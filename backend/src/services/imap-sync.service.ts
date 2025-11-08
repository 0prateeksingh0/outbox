// Real-time email sync using IMAP IDLE mode
import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { getEmailAccounts, EmailAccountConfig } from '../config/email.config';
import { prisma } from '../config/database';
import { ElasticsearchService } from './elasticsearch.service';
import { EmailCategorizationService } from './ai-categorization.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class IMAPSyncService {
  private static instance: IMAPSyncService;
  private imapConnections: Map<string, Imap> = new Map();
  private isRunning = false;
  
  private constructor() {}
  
  static getInstance(): IMAPSyncService {
    if (!IMAPSyncService.instance) {
      IMAPSyncService.instance = new IMAPSyncService();
    }
    return IMAPSyncService.instance;
  }
  
  
  async startSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('IMAP sync is already running');
      return;
    }
    
    this.isRunning = true;
    const accounts = getEmailAccounts();
    
    logger.info(`Starting IMAP sync for ${accounts.length} account(s)...`);
    
    for (const account of accounts) {
      await this.syncAccount(account);
    }
  }
  
  
  private async syncAccount(config: EmailAccountConfig): Promise<void> {
    try {
      // Create or update account in database
      await prisma.emailAccount.upsert({
        where: { email: config.email },
        update: { 
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          isActive: true,
        },
        create: {
          id: config.id,
          email: config.email,
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          password: config.password, // In production, encrypt this!
          isActive: true,
        },
      });
      
      // Create IMAP connection
      const imap = new Imap({
        user: config.email,
        password: config.password,
        host: config.imapHost,
        port: config.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000, // Send keepalive every 10 seconds
          idleInterval: 300000, // Re-IDLE every 5 minutes
          forceNoop: false,
        },
      });
      
      this.imapConnections.set(config.id, imap);
      
      // Set up event handlers
      this.setupIMAPHandlers(imap, config);
      
      // Connect
      imap.connect();
      
    } catch (error) {
      logger.error(`Failed to sync account ${config.email}:`, error);
    }
  }
  
  
  private setupIMAPHandlers(imap: Imap, config: EmailAccountConfig): void {
    imap.once('ready', () => {
      logger.info(`✓ Connected to ${config.email}`);
      
      // Open INBOX
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          logger.error(`Failed to open INBOX for ${config.email}:`, err);
          return;
        }
        
        logger.info(`✓ Opened INBOX for ${config.email} (${box.messages.total} messages)`);
        
        // Initial sync: Fetch last 30 days
        await this.fetchRecentEmails(imap, config, 30);
        
        // Start IDLE mode for real-time updates
        this.startIdleMode(imap, config);
      });
    });
    
    imap.once('error', (err: Error) => {
      logger.error(`IMAP error for ${config.email}:`, err);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        logger.info(`Reconnecting ${config.email}...`);
        imap.connect();
      }, 5000);
    });
    
    imap.once('end', () => {
      logger.info(`Connection ended for ${config.email}`);
    });
  }
  
  
  private startIdleMode(imap: Imap, config: EmailAccountConfig): void {
    logger.info(`Starting IDLE mode for ${config.email} (PUSH notifications enabled)`);
    
    // Listen for new mail notifications
    imap.on('mail', async (numNewMsgs: number) => {
      logger.info(`📨 NEW MAIL! ${numNewMsgs} new message(s) in ${config.email}`);
      
      // Stop IDLE to fetch new messages
      imap.end();
      
      // Fetch the new messages
      await this.fetchNewEmails(imap, config);
      
      // Restart IDLE
      this.startIdleMode(imap, config);
    });
    
    // Start IDLE
    try {
      (imap as any).idle();
    } catch (error) {
      logger.error(`Failed to start IDLE for ${config.email}:`, error);
    }
  }
  
  
  private async fetchRecentEmails(
    imap: Imap, 
    config: EmailAccountConfig, 
    days: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      
      logger.info(`Fetching emails from last ${days} days for ${config.email}...`);
      
      // Search for emails since date
      imap.search(['ALL', ['SINCE', sinceDate]], async (err, results) => {
        if (err) {
          logger.error('Search error:', err);
          reject(err);
          return;
        }
        
        if (!results || results.length === 0) {
          logger.info(`No emails found in last ${days} days`);
          resolve();
          return;
        }
        
        logger.info(`Found ${results.length} emails to sync`);
        

        const batchSize = 50;
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          await this.fetchEmailBatch(imap, config, batch);
        }
        
        resolve();
      });
    });
  }
  
  
  private async fetchNewEmails(imap: Imap, config: EmailAccountConfig): Promise<void> {
    return new Promise((resolve) => {
      imap.search(['UNSEEN'], async (err, results) => {
        if (err || !results || results.length === 0) {
          resolve();
          return;
        }
        
        await this.fetchEmailBatch(imap, config, results);
        resolve();
      });
    });
  }
  
  
  private async fetchEmailBatch(
    imap: Imap, 
    config: EmailAccountConfig, 
    seqNumbers: number[]
  ): Promise<void> {
    if (seqNumbers.length === 0) return;
    
    return new Promise((resolve) => {
      const fetch = imap.fetch(seqNumbers, {
        bodies: '',
        struct: true,
      });
      
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream) => {
          simpleParser(stream as any).then(async (parsed) => {
            try {
              await this.processEmail(parsed, config);
            } catch (error) {
              logger.error(`Failed to process email ${seqno}:`, error);
            }
          }).catch((error) => {
            logger.error(`Failed to parse email ${seqno}:`, error);
          });
        });
      });
      
      fetch.once('error', (err: Error) => {
        logger.error('Fetch error:', err);
        resolve();
      });
      
      fetch.once('end', () => {
        logger.info(`Processed batch of ${seqNumbers.length} emails`);
        resolve();
      });
    });
  }
  
  
  private async processEmail(parsed: ParsedMail, config: EmailAccountConfig): Promise<void> {
    try {
      const messageId = parsed.messageId || `${Date.now()}-${Math.random()}`;
      
      // Check if email already exists
      const existing = await prisma.email.findUnique({
        where: { messageId },
      });
      
      if (existing) {
        return; // Skip duplicates
      }
      
      // Get account from database
      const account = await prisma.emailAccount.findUnique({
        where: { email: config.email },
      });
      
      if (!account) {
        logger.error(`Account not found: ${config.email}`);
        return;
      }
      
      // Helper function to extract email address
      const getEmailAddress = (addressObj: any): string => {
        if (!addressObj) return '';
        if (typeof addressObj === 'string') return addressObj;
        if (addressObj.text) return addressObj.text;
        if (Array.isArray(addressObj)) {
          return addressObj[0]?.address || addressObj[0]?.text || '';
        }
        if (addressObj.value && Array.isArray(addressObj.value)) {
          return addressObj.value[0]?.address || '';
        }
        return addressObj.address || '';
      };

      // Save to PostgreSQL
      const email = await prisma.email.create({
        data: {
          messageId,
          emailAccountId: account.id,
          from: getEmailAddress(parsed.from),
          to: getEmailAddress(parsed.to),
          subject: parsed.subject || '',
          body: parsed.text || '',
          htmlBody: parsed.html || null,
          date: parsed.date || new Date(),
          category: 'UNCATEGORIZED',
        },
      });
      
      logger.info(`✓ Saved email: ${email.subject}`);
      
      // Index in Elasticsearch (async)
      const esService = ElasticsearchService.getInstance();
      esService.indexEmail(email).catch((err) => {
        logger.error('Failed to index email in Elasticsearch:', err);
      });
      
      // Categorize with AI (async)
      const categorizationService = EmailCategorizationService.getInstance();
      categorizationService.categorizeEmail(email).catch((err) => {
        logger.error('Failed to categorize email:', err);
      });
      
    } catch (error) {
      logger.error('Failed to process email:', error);
    }
  }
  
  
  async stopSync(): Promise<void> {
    logger.info('Stopping IMAP sync...');
    this.isRunning = false;
    
    for (const [accountId, imap] of this.imapConnections) {
      try {
        imap.end();
      } catch (error) {
        logger.error(`Failed to close connection for ${accountId}:`, error);
      }
    }
    
    this.imapConnections.clear();
    logger.info('IMAP sync stopped');
  }
}
