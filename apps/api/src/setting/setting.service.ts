import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { MemoryStoredFile } from 'nestjs-form-data';
import type {
  SchoolProfileDto,
  TelegramIntegrationDto,
  TestTelegramConnectionDto,
  TestTelegramResultDto,
  UpdateSchoolProfileDto,
  UpdateTelegramIntegrationDto,
} from '@repo/contracts';
import { Branch } from '@src/branch/entity/branch.entity.js';
import type { AuthContext } from '@src/common/helper/branch-scoping.helper.js';
import {
  decryptToken,
  encryptToken,
  maskToken,
} from '@src/common/helper/crypto.helper.js';
import { BranchIntegration } from './entity/branch-integration.entity.js';
import { TelegramService } from './telegram.service.js';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,

    @InjectRepository(BranchIntegration)
    private readonly integrationRepo: Repository<BranchIntegration>,

    private readonly telegramService: TelegramService,
  ) {}

  private resolveBranchId(currentUser?: AuthContext): number {
    if (!currentUser?.branchId) {
      throw new NotFoundException('No branch assigned to current user');
    }
    return currentUser.branchId;
  }

  async getSchoolProfile(currentUser: AuthContext): Promise<SchoolProfileDto> {
    const branchId = this.resolveBranchId(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    return {
      id: branch.id,
      uuid: branch.uuid,
      name: branch.name,
      nameKhmer: branch.nameKhmer,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      website: branch.website,
      motto: branch.motto,
      logoUrl: branch.logoUrl,
      receiptFooterTerms: branch.receiptFooterTerms,
      receiptSignatureTitle: branch.receiptSignatureTitle,
      isDefault: branch.isDefault,
      status: branch.status,
      updatedAt: branch.updatedAt,
    };
  }

  async updateSchoolProfile(
    currentUser: AuthContext,
    dto: UpdateSchoolProfileDto,
  ): Promise<SchoolProfileDto> {
    const branchId = this.resolveBranchId(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    if (dto.code && dto.code.toUpperCase() !== branch.code) {
      const existing = await this.branchRepo.findOne({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing && existing.id !== branchId) {
        throw new ConflictException(`Branch code "${dto.code}" already exists`);
      }
      branch.code = dto.code.toUpperCase();
    }

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.nameKhmer !== undefined) branch.nameKhmer = dto.nameKhmer || null;
    if (dto.address !== undefined) branch.address = dto.address || null;
    if (dto.phone !== undefined) branch.phone = dto.phone || null;
    if (dto.email !== undefined) branch.email = dto.email || null;
    if (dto.website !== undefined) branch.website = dto.website || null;
    if (dto.motto !== undefined) branch.motto = dto.motto || null;
    if (dto.receiptFooterTerms !== undefined) {
      branch.receiptFooterTerms = dto.receiptFooterTerms || null;
    }
    if (dto.receiptSignatureTitle !== undefined) {
      branch.receiptSignatureTitle = dto.receiptSignatureTitle || null;
    }

    const saved = await this.branchRepo.save(branch);
    return this.getSchoolProfile({ ...currentUser, branchId: saved.id });
  }

  async uploadSchoolLogo(
    currentUser: AuthContext,
    file: MemoryStoredFile,
  ): Promise<SchoolProfileDto> {
    const branchId = this.resolveBranchId(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Valid logo image file is required');
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'logos');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean up old file if exists
    if (branch.logoUrl) {
      const oldFilename = branch.logoUrl.replace('/uploads/logos/', '');
      const oldFilePath = join(uploadsDir, oldFilename);
      if (existsSync(oldFilePath)) {
        try {
          unlinkSync(oldFilePath);
        } catch {
          // Ignore unlink errors
        }
      }
    }

    const rawExt = extname(file.originalName || '') || '.png';
    const ext = rawExt.startsWith('.') ? rawExt : `.${rawExt}`;
    const filename = `branch-${branchId}-${Date.now()}${ext}`;
    const filePath = join(uploadsDir, filename);

    writeFileSync(filePath, file.buffer);

    branch.logoUrl = `/uploads/logos/${filename}`;
    await this.branchRepo.save(branch);

    return this.getSchoolProfile(currentUser);
  }

  async deleteSchoolLogo(currentUser: AuthContext): Promise<SchoolProfileDto> {
    const branchId = this.resolveBranchId(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    if (branch.logoUrl) {
      const oldFilename = branch.logoUrl.replace('/uploads/logos/', '');
      const oldFilePath = join(process.cwd(), 'uploads', 'logos', oldFilename);
      if (existsSync(oldFilePath)) {
        try {
          unlinkSync(oldFilePath);
        } catch {
          // Ignore unlink errors
        }
      }
    }

    branch.logoUrl = null;
    await this.branchRepo.save(branch);

    return this.getSchoolProfile(currentUser);
  }

  async getTelegramIntegration(
    currentUser: AuthContext,
  ): Promise<TelegramIntegrationDto> {
    const branchId = this.resolveBranchId(currentUser);
    let integration = await this.integrationRepo.findOne({
      where: { branchId, provider: 'TELEGRAM' },
    });

    if (!integration) {
      return {
        branchId,
        provider: 'TELEGRAM',
        isEnabled: false,
        isConfigured: false,
        botUsername: null,
        botTokenMasked: null,
        defaultChatId: null,
        attendanceChatId: null,
        paymentChatId: null,
        leaveChatId: null,
        announcementChatId: null,
        notificationEvents: {
          attendance: true,
          payment: true,
          leave: true,
          announcement: false,
        },
        lastTestedAt: null,
        lastTestStatus: 'NOT_TESTED',
        lastErrorMessage: null,
      };
    }

    const decrypted = integration.botTokenEncrypted
      ? decryptToken(integration.botTokenEncrypted)
      : '';

    return {
      id: integration.id,
      uuid: integration.uuid,
      branchId: integration.branchId,
      provider: 'TELEGRAM',
      isEnabled: integration.isEnabled,
      isConfigured: Boolean(integration.botTokenEncrypted && integration.defaultChatId),
      botUsername: integration.botUsername,
      botTokenMasked: maskToken(decrypted),
      defaultChatId: integration.defaultChatId,
      attendanceChatId: integration.attendanceChatId,
      paymentChatId: integration.paymentChatId,
      leaveChatId: integration.leaveChatId,
      announcementChatId: integration.announcementChatId,
      notificationEvents: integration.notificationEvents,
      lastTestedAt: integration.lastTestedAt,
      lastTestStatus: integration.lastTestStatus as any,
      lastErrorMessage: integration.lastErrorMessage,
    };
  }

  async updateTelegramIntegration(
    currentUser: AuthContext,
    dto: UpdateTelegramIntegrationDto,
  ): Promise<TelegramIntegrationDto> {
    const branchId = this.resolveBranchId(currentUser);
    let integration = await this.integrationRepo.findOne({
      where: { branchId, provider: 'TELEGRAM' },
    });

    if (!integration) {
      integration = this.integrationRepo.create({
        branchId,
        provider: 'TELEGRAM',
      });
    }

    // Only update token if raw token is passed (not masked with ••••)
    if (dto.botToken && !dto.botToken.includes('••••')) {
      const meRes = await this.telegramService.getMe(dto.botToken);
      if (meRes.ok && meRes.result?.username) {
        integration.botUsername = `@${meRes.result.username}`;
      }
      integration.botTokenEncrypted = encryptToken(dto.botToken);
    }

    integration.isEnabled = dto.isEnabled ?? integration.isEnabled;
    integration.defaultChatId = dto.defaultChatId || null;
    integration.attendanceChatId = dto.attendanceChatId || null;
    integration.paymentChatId = dto.paymentChatId || null;
    integration.leaveChatId = dto.leaveChatId || null;
    integration.announcementChatId = dto.announcementChatId || null;
    if (dto.notificationEvents) {
      integration.notificationEvents = dto.notificationEvents;
    }

    await this.integrationRepo.save(integration);
    return this.getTelegramIntegration(currentUser);
  }

  async testTelegramConnection(
    currentUser: AuthContext,
    dto: TestTelegramConnectionDto,
  ): Promise<TestTelegramResultDto> {
    const branchId = this.resolveBranchId(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const integration = await this.integrationRepo.findOne({
      where: { branchId, provider: 'TELEGRAM' },
    });

    if (!integration || !integration.botTokenEncrypted) {
      throw new BadRequestException(
        'Telegram Bot Token is not configured. Please enter your Bot Token first.',
      );
    }

    const botToken = decryptToken(integration.botTokenEncrypted);
    const targetChatId =
      dto.chatId ||
      this.telegramService.resolveChatId(integration, dto.targetCategory as any) ||
      integration.defaultChatId;

    if (!targetChatId) {
      throw new BadRequestException(
        'Target Chat ID is missing. Please configure a Default Chat ID first.',
      );
    }

    const result = await this.telegramService.sendTestMessage(
      botToken,
      targetChatId,
      branch.name,
      dto.targetCategory,
    );

    integration.lastTestedAt = new Date();
    integration.lastTestStatus = result.success ? 'SUCCESS' : 'FAILED';
    integration.lastErrorMessage = result.success ? null : result.message;
    if (result.botUsername && !integration.botUsername) {
      integration.botUsername = result.botUsername;
    }

    await this.integrationRepo.save(integration);

    return result;
  }
}
