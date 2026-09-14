import { z } from 'zod';
import { BranchStatusEnum } from './branch.dto.js';

export const UpdateSchoolProfileSchema = z.object({
  name: z.string().min(1, 'School/Branch name is required').max(255),
  nameKhmer: z.string().max(255).optional().or(z.literal('')),
  code: z.string().min(1).max(20).optional(),
  address: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  motto: z.string().max(255).optional().or(z.literal('')),
  receiptFooterTerms: z.string().max(1000).optional().or(z.literal('')),
  receiptSignatureTitle: z.string().max(100).optional().or(z.literal('')),
});

export type UpdateSchoolProfileDto = z.infer<typeof UpdateSchoolProfileSchema>;

export const SchoolProfileSchema = z.object({
  id: z.number(),
  uuid: z.string().uuid(),
  name: z.string(),
  nameKhmer: z.string().nullable().optional(),
  code: z.string(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  motto: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  receiptFooterTerms: z.string().nullable().optional(),
  receiptSignatureTitle: z.string().nullable().optional(),
  isDefault: z.boolean(),
  status: z.nativeEnum(BranchStatusEnum),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type SchoolProfileDto = z.infer<typeof SchoolProfileSchema>;

export const TelegramNotificationEventsSchema = z.object({
  attendance: z.boolean().default(true),
  payment: z.boolean().default(true),
  leave: z.boolean().default(true),
  announcement: z.boolean().default(false),
});

export type TelegramNotificationEventsDto = z.infer<typeof TelegramNotificationEventsSchema>;

export const UpdateTelegramIntegrationSchema = z.object({
  isEnabled: z.boolean().default(false),
  botToken: z.string().optional().describe('Raw Telegram Bot token. Masked tokens (••••) are ignored and existing token preserved.'),
  defaultChatId: z.string().min(1, 'Default Chat ID is required'),
  attendanceChatId: z.string().optional().or(z.literal('')),
  paymentChatId: z.string().optional().or(z.literal('')),
  leaveChatId: z.string().optional().or(z.literal('')),
  announcementChatId: z.string().optional().or(z.literal('')),
  notificationEvents: TelegramNotificationEventsSchema.default({
    attendance: true,
    payment: true,
    leave: true,
    announcement: false,
  }),
});

export type UpdateTelegramIntegrationDto = z.infer<typeof UpdateTelegramIntegrationSchema>;

export const TelegramIntegrationSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().uuid().optional(),
  branchId: z.number(),
  provider: z.literal('TELEGRAM'),
  isEnabled: z.boolean(),
  isConfigured: z.boolean(),
  botUsername: z.string().nullable().optional(),
  botTokenMasked: z.string().nullable().optional(),
  defaultChatId: z.string().nullable().optional(),
  attendanceChatId: z.string().nullable().optional(),
  paymentChatId: z.string().nullable().optional(),
  leaveChatId: z.string().nullable().optional(),
  announcementChatId: z.string().nullable().optional(),
  notificationEvents: TelegramNotificationEventsSchema,
  lastTestedAt: z.union([z.string(), z.date(), z.null()]).optional(),
  lastTestStatus: z.enum(['SUCCESS', 'FAILED', 'NOT_TESTED']).optional(),
  lastErrorMessage: z.string().nullable().optional(),
});

export type TelegramIntegrationDto = z.infer<typeof TelegramIntegrationSchema>;

export const TestTelegramConnectionSchema = z.object({
  targetCategory: z.enum(['default', 'attendance', 'payment', 'leave', 'announcement']).default('default'),
  chatId: z.string().optional(),
  customMessage: z.string().max(200).optional(),
});

export type TestTelegramConnectionDto = z.infer<typeof TestTelegramConnectionSchema>;

export const TestTelegramResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  botUsername: z.string().optional(),
  chatId: z.string(),
  testedAt: z.string(),
});

export type TestTelegramResultDto = z.infer<typeof TestTelegramResultSchema>;
