import { z } from 'zod';
import { createSortSchema, PaginationSchema } from './pagination.dto.js';

export enum BranchStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const BranchSchema = z.object({
  id: z.number(),
  uuid: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  isDefault: z.boolean().default(false),
  status: z.nativeEnum(BranchStatusEnum).default(BranchStatusEnum.ACTIVE),
  adminUserId: z.number().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  deletedAt: z.union([z.string(), z.date(), z.null()]).optional(),
});

export type BranchDto = z.infer<typeof BranchSchema>;

export const CreateBranchWithAdminSchema = z.object({
  branchName: z.string().min(1, 'Branch/School name is required'),
  code: z.string().min(1, 'Branch code is required').max(20),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  adminUsername: z.string().min(3, 'Username must be at least 3 characters'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  adminName: z.string().min(1, 'Admin display name is required'),
  adminEmail: z.string().email().optional().or(z.literal('')),
  adminPhone: z.string().optional(),
});

export type CreateBranchWithAdminDto = z.infer<typeof CreateBranchWithAdminSchema>;

export const UpdateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.nativeEnum(BranchStatusEnum).optional(),
});

export type UpdateBranchDto = z.infer<typeof UpdateBranchSchema>;

export const FindBranchesSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'name', 'code', 'createdAt', 'updatedAt'], 'id'),
  search: z.string().optional(),
  status: z.nativeEnum(BranchStatusEnum).optional(),
});

export type FindBranchesDto = z.infer<typeof FindBranchesSchema>;
