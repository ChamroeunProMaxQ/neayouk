import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { decryptToken } from '@src/common/helper/crypto.helper.js';
import { BranchIntegration } from './entity/branch-integration.entity.js';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(BranchIntegration)
    private readonly integrationRepo: Repository<BranchIntegration>,
  ) {}

  async getMe(botToken: string): Promise<{
    ok: boolean;
    result?: { id: number; is_bot: boolean; first_name: string; username: string };
    description?: string;
  }> {
    if (!botToken) {
      return { ok: false, description: 'Bot token is missing' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      this.logger.error(`Telegram getMe error: ${err?.message || err}`);
      return { ok: false, description: err?.message || 'Network error connecting to Telegram' };
    }
  }

  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<{ ok: boolean; description?: string }> {
    if (!botToken || !chatId || !text) {
      return { ok: false, description: 'Missing required parameters (token, chatId, or text)' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      this.logger.error(`Telegram sendMessage error: ${err?.message || err}`);
      return { ok: false, description: err?.message || 'Failed to dispatch message to Telegram' };
    }
  }

  resolveChatId(
    integration: BranchIntegration,
    category: 'attendance' | 'payment' | 'leave' | 'announcement' | 'default' = 'default',
  ): string {
    if (category === 'attendance' && integration.attendanceChatId) {
      return integration.attendanceChatId;
    }
    if (category === 'payment' && integration.paymentChatId) {
      return integration.paymentChatId;
    }
    if (category === 'leave' && integration.leaveChatId) {
      return integration.leaveChatId;
    }
    if (category === 'announcement' && integration.announcementChatId) {
      return integration.announcementChatId;
    }
    return integration.defaultChatId || '';
  }

  async sendTestMessage(
    botToken: string,
    chatId: string,
    schoolName: string,
    category: string = 'General',
  ): Promise<{
    success: boolean;
    message: string;
    botUsername?: string;
    chatId: string;
    testedAt: string;
  }> {
    const testedAt = new Date().toISOString();

    const meRes = await this.getMe(botToken);
    if (!meRes.ok) {
      return {
        success: false,
        message: `Invalid Bot Token: ${meRes.description || 'Unauthorized'}`,
        chatId,
        testedAt,
      };
    }

    const botUsername = meRes.result?.username ? `@${meRes.result.username}` : 'Bot';

    const testText = [
      `🔔 <b>Test Notification from ${schoolName}</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `✅ <b>Status</b>: Connection Verified Successfully`,
      `🤖 <b>Bot</b>: ${botUsername}`,
      `🏷️ <b>Channel Category</b>: ${category.toUpperCase()}`,
      `⏰ <b>Timestamp</b>: ${new Date().toLocaleString()}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>This is a test notification verifying your institutional Telegram alert integration with Neayouk CMS.</i>`,
    ].join('\n');

    const sendRes = await this.sendMessage(botToken, chatId, testText, 'HTML');
    if (!sendRes.ok) {
      return {
        success: false,
        message: `Telegram Error: ${sendRes.description || 'Could not send message. Ensure bot is an administrator in the target group/channel.'}`,
        botUsername,
        chatId,
        testedAt,
      };
    }

    return {
      success: true,
      message: `Test message dispatched successfully to chat ${chatId} via ${botUsername}!`,
      botUsername,
      chatId,
      testedAt,
    };
  }

  async dispatchNotification(
    branchId: number,
    category: 'attendance' | 'payment' | 'leave' | 'announcement',
    formattedMessage: string,
  ): Promise<void> {
    try {
      const integration = await this.integrationRepo.findOne({
        where: { branchId, provider: 'TELEGRAM' },
      });

      if (!integration || !integration.isEnabled || !integration.botTokenEncrypted) {
        return;
      }

      const events = integration.notificationEvents;
      if (events && events[category] === false) {
        return;
      }

      const targetChatId = this.resolveChatId(integration, category);
      if (!targetChatId) {
        return;
      }

      const botToken = decryptToken(integration.botTokenEncrypted);
      if (!botToken) {
        return;
      }

      await this.sendMessage(botToken, targetChatId, formattedMessage, 'HTML');
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch automated Telegram alert for branch ${branchId}: ${err?.message || err}`);
    }
  }
}
