// Slack and webhook notifications
import { IncomingWebhook } from '@slack/webhook';
import axios from 'axios';
import { Email } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class NotificationService {
  private static instance: NotificationService;
  private slackWebhook?: IncomingWebhook;
  private externalWebhookUrl?: string;
  
  private constructor() {
    if (process.env.SLACK_WEBHOOK_URL) {
      this.slackWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    }
    
    this.externalWebhookUrl = process.env.EXTERNAL_WEBHOOK_URL;
  }
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  
  async notifyInterestedEmail(email: Email): Promise<void> {
    logger.info(`📢 Sending notifications for INTERESTED email: ${email.subject}`);
    
    try {
      // Send Slack notification
      if (this.slackWebhook && !email.slackNotified) {
        await this.sendSlackNotification(email);
        await prisma.email.update({
          where: { id: email.id },
          data: { slackNotified: true },
        });
      }
      
      // Trigger external webhook
      if (this.externalWebhookUrl && !email.webhookTriggered) {
        await this.triggerWebhook(email);
        await prisma.email.update({
          where: { id: email.id },
          data: { webhookTriggered: true },
        });
      }
      
    } catch (error) {
      logger.error('Failed to send notifications:', error);
    }
  }
  
  
  private async sendSlackNotification(email: Email): Promise<void> {
    if (!this.slackWebhook) return;
    
    const bodyPreview = email.body.substring(0, 200).replace(/\n/g, ' ');
    
    try {
      await this.slackWebhook.send({
        text: '🎯 New Interested Lead!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Lead!',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from}`,
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${email.date.toLocaleString()}`,
              },
            ],
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${bodyPreview}...`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Email ID: ${email.id}`,
              },
            ],
          },
        ],
      });
      
      logger.info('✓ Slack notification sent');
      
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
      throw error;
    }
  }
  
  
  private async triggerWebhook(email: Email): Promise<void> {
    if (!this.externalWebhookUrl) return;
    
    try {
      const payload = {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        data: {
          emailId: email.id,
          messageId: email.messageId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body,
          date: email.date.toISOString(),
          category: email.category,
          categoryConfidence: email.categoryConfidence,
        },
      };
      
      const response = await axios.post(this.externalWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox-Onebox/1.0',
        },
        timeout: 5000,
      });
      
      logger.info(`✓ Webhook triggered (status: ${response.status})`);
      
    } catch (error) {
      logger.error('Failed to trigger webhook:', error);
      throw error;
    }
  }
  
  
  async sendTestNotification(): Promise<void> {
    if (this.slackWebhook) {
      await this.slackWebhook.send({
        text: '✅ Test notification from ReachInbox Onebox',
      });
      logger.info('Test Slack notification sent');
    }
    
    if (this.externalWebhookUrl) {
      await axios.post(this.externalWebhookUrl, {
        event: 'test',
        message: 'Test webhook from ReachInbox Onebox',
        timestamp: new Date().toISOString(),
      });
      logger.info('Test webhook sent');
    }
  }
}
