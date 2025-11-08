import { Client } from '@elastic/elasticsearch';
import { Email } from '@prisma/client';
import { logger } from '../utils/logger';

interface EmailDocument {
  id: string;
  messageId: string;
  emailAccountId: string;
  folderId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  category?: string;
  isRead: boolean;
  isFlagged: boolean;
}

export class ElasticsearchService {
  private static instance: ElasticsearchService;
  private client: Client;
  private readonly indexName = 'emails';
  
  private constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });
  }
  
  static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  email_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                messageId: { type: 'keyword' },
                emailAccountId: { type: 'keyword' },
                folderId: { type: 'keyword' },
                from: { 
                  type: 'text',
                  analyzer: 'email_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                to: { 
                  type: 'text',
                  analyzer: 'email_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                subject: { 
                  type: 'text',
                  analyzer: 'email_analyzer',
                },
                body: { 
                  type: 'text',
                  analyzer: 'email_analyzer',
                },
                date: { type: 'date' },
                category: { type: 'keyword' },
                isRead: { type: 'boolean' },
                isFlagged: { type: 'boolean' },
              },
            },
          },
        });
        
        logger.info('✓ Elasticsearch index created');
      } else {
        logger.info('✓ Elasticsearch index already exists');
      }
      
      const health = await this.client.cluster.health();
      logger.info(`Elasticsearch cluster health: ${health.status}`);
      
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch:', error);
      throw error;
    }
  }
  
  async indexEmail(email: Email): Promise<void> {
    try {
      const document: EmailDocument = {
        id: email.id,
        messageId: email.messageId,
        emailAccountId: email.emailAccountId,
        folderId: email.folderId || undefined,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.date.toISOString(),
        category: email.category || undefined,
        isRead: email.isRead,
        isFlagged: email.isFlagged,
      };
      
      await this.client.index({
        index: this.indexName,
        id: email.id,
        document,
      });
      
      logger.debug(`Indexed email: ${email.id}`);
      
    } catch (error) {
      logger.error('Failed to index email:', error);
      throw error;
    }
  }
  
  async updateEmail(emailId: string, updates: Partial<EmailDocument>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: emailId,
        doc: updates,
      });
      
      logger.debug(`Updated email: ${emailId}`);
      
    } catch (error) {
      logger.error('Failed to update email:', error);
      throw error;
    }
  }
  
  async searchEmails(params: {
    query?: string;
    accountId?: string;
    folderId?: string;
    category?: string;
    from?: number;
    size?: number;
  }): Promise<{ total: number; emails: any[] }> {
    try {
      const must: any[] = [];
      
      if (params.query) {
        must.push({
          multi_match: {
            query: params.query,
            fields: ['subject^2', 'body', 'from', 'to'],
            fuzziness: 'AUTO',
          },
        });
      }
      
      if (params.accountId) {
        must.push({ term: { emailAccountId: params.accountId } });
      }
      
      if (params.folderId) {
        must.push({ term: { folderId: params.folderId } });
      }
      
      if (params.category) {
        must.push({ term: { category: params.category } });
      }
      
      const result = await this.client.search({
        index: this.indexName,
        from: params.from || 0,
        size: params.size || 20,
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          sort: [{ date: { order: 'desc' } }],
          highlight: {
            fields: {
              subject: {},
              body: {},
            },
          },
        },
      });
      
      return {
        total: typeof result.hits.total === 'number' 
          ? result.hits.total 
          : result.hits.total?.value || 0,
        emails: result.hits.hits.map((hit: any) => ({
          ...hit._source,
          highlight: hit.highlight,
        })),
      };
      
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }
  
  async getEmailStats(accountId?: string): Promise<any> {
    try {
      const query = accountId 
        ? { term: { emailAccountId: accountId } }
        : { match_all: {} };
      
      const result = await this.client.search({
        index: this.indexName,
        size: 0,
        body: {
          query,
          aggs: {
            by_category: {
              terms: { field: 'category' },
            },
            by_account: {
              terms: { field: 'emailAccountId' },
            },
            by_date: {
              date_histogram: {
                field: 'date',
                calendar_interval: 'day',
              },
            },
          },
        },
      });
      
      return result.aggregations;
      
    } catch (error) {
      logger.error('Failed to get stats:', error);
      throw error;
    }
  }
  
  async deleteEmail(emailId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: emailId,
      });
      
      logger.debug(`Deleted email: ${emailId}`);
      
    } catch (error) {
      logger.error('Failed to delete email:', error);
      throw error;
    }
  }
}
