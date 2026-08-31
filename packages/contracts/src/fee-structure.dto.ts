import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";

export enum FeeCategoryEnum {
  BOOK = "BOOK",
  UNIFORM = "UNIFORM",
  TUITION = "TUITION",
  REGISTRATION = "REGISTRATION",
  TRANSPORTATION = "TRANSPORTATION",
  MEALS = "MEALS",
  ACTIVITIES = "ACTIVITIES",
  EXAM = "EXAM",
  OTHER = "OTHER",
}

export enum BillingCycleEnum {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMESTER = "SEMESTER",
  ANNUAL = "ANNUAL",
}

export const FeeStructureSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  branchId: z.number().nullable().optional(),
  name: z.string(),
  category: z.enum(FeeCategoryEnum),
  amount: z.coerce.number(),
  billingCycle: z.enum(BillingCycleEnum),
  isOptional: z.boolean().default(false),
  programId: z.number().nullable().optional(),
  academicYear: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type FeeStructureAttribute = z.infer<typeof FeeStructureSchema>;

export const CreateFeeStructureSchema = z.object({
  branchId: z.number().optional(),
  name: z.string().min(1, "Fee structure name is required"),
  category: z.enum(FeeCategoryEnum).default(FeeCategoryEnum.TUITION),
  amount: z.coerce.number().min(0, "Amount must be zero or positive"),
  billingCycle: z.enum(BillingCycleEnum).default(BillingCycleEnum.MONTHLY),
  isOptional: z.boolean().default(false).optional(),
  programId: z.coerce.number().optional().nullable(),
  academicYear: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export type CreateFeeStructureDto = z.infer<typeof CreateFeeStructureSchema>;

export const UpdateFeeStructureSchema = CreateFeeStructureSchema.partial();

export type UpdateFeeStructureDto = z.infer<typeof UpdateFeeStructureSchema>;

export const FindFeeStructuresSchema = PaginationSchema.extend({
  ...createSortSchema(["id", "name", "category", "amount", "createdAt"], "id"),
  search: z.string().optional(),
  branchId: z.coerce.number().optional(),
  category: z.enum(FeeCategoryEnum).optional(),
  billingCycle: z.enum(BillingCycleEnum).optional(),
  isActive: z.coerce.boolean().optional(),
  programId: z.coerce.number().optional(),
});

export type FindFeeStructuresDto = z.infer<typeof FindFeeStructuresSchema>;
