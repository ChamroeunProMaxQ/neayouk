import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { PaymentMethodEnum } from "./payment-status.enum.js";
import { StaffDepartmentEnum, StaffSalaryTypeEnum, StaffSchema } from "./staff.dto.js";
import { UserSchema } from "./user.dto.js";

export enum PayrollStatusEnum {
  DRAFT = "DRAFT",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum PayrollItemTypeEnum {
  BONUS = "BONUS",
  ALLOWANCE = "ALLOWANCE",
  OVERTIME = "OVERTIME",
  DEDUCTION = "DEDUCTION",
  TAX = "TAX",
  ADVANCE_SALARY = "ADVANCE_SALARY",
  OTHER = "OTHER",
}

export const PayrollItemSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  payrollId: z.number().optional(),
  itemType: z.nativeEnum(PayrollItemTypeEnum).default(PayrollItemTypeEnum.BONUS),
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
  description: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type PayrollItemAttribute = z.infer<typeof PayrollItemSchema>;

export const CreatePayrollItemSchema = z.object({
  itemType: z.nativeEnum(PayrollItemTypeEnum).default(PayrollItemTypeEnum.BONUS),
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
  description: z.string().optional(),
});

export type CreatePayrollItemDto = z.infer<typeof CreatePayrollItemSchema>;

export const PayrollSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  payrollNumber: z.string(),
  staffId: z.number(),
  staff: StaffSchema.optional(),
  year: z.number(),
  month: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  workingDays: z.number().default(22),
  holidayDays: z.number().default(0),
  salaryType: z.nativeEnum(StaffSalaryTypeEnum).default(StaffSalaryTypeEnum.MONTHLY),
  baseSalary: z.coerce.number().default(0),
  hourlyRate: z.coerce.number().default(0),
  totalHoursWorked: z.coerce.number().default(0),
  calculatedBaseAmount: z.coerce.number().default(0),
  totalBonus: z.coerce.number().default(0),
  totalDeduction: z.coerce.number().default(0),
  grossSalary: z.coerce.number().default(0),
  netSalary: z.coerce.number().default(0),
  status: z.nativeEnum(PayrollStatusEnum).default(PayrollStatusEnum.DRAFT),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).nullable().optional(),
  paymentDate: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  processedBy: z.number().nullable().optional(),
  processedByUser: UserSchema.nullable().optional(),
  items: z.array(PayrollItemSchema).optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type PayrollAttribute = z.infer<typeof PayrollSchema>;

export const CreatePayrollSchema = z.object({
  staffId: z.coerce.number().min(1, "Staff is required"),
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalHoursWorked: z.coerce.number().min(0).optional(),
  baseSalary: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  salaryType: z.nativeEnum(StaffSalaryTypeEnum).optional(),
  notes: z.string().optional(),
  items: z.array(CreatePayrollItemSchema).optional(),
});

export type CreatePayrollAttribute = z.infer<typeof CreatePayrollSchema>;
export type CreatePayrollDto = z.infer<typeof CreatePayrollSchema>;

export const UpdatePayrollSchema = z.object({
  totalHoursWorked: z.coerce.number().min(0).optional(),
  baseSalary: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(CreatePayrollItemSchema).optional(),
});

export type UpdatePayrollAttribute = z.infer<typeof UpdatePayrollSchema>;
export type UpdatePayrollDto = z.infer<typeof UpdatePayrollSchema>;

export const ProcessPayrollPaymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethodEnum).default(PaymentMethodEnum.BANK_TRANSFER),
  paymentDate: z.string().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export type ProcessPayrollPaymentDto = z.infer<typeof ProcessPayrollPaymentSchema>;

export const FindPayrollsSchema = PaginationSchema.extend({
  ...createSortSchema(
    [
      "id",
      "payrollNumber",
      "year",
      "month",
      "salaryType",
      "calculatedBaseAmount",
      "grossSalary",
      "netSalary",
      "status",
      "paymentDate",
      "createdAt",
    ],
    "id"
  ),
  search: z.string().optional(),
  staffId: z.coerce.number().optional(),
  department: z.enum(StaffDepartmentEnum).optional(),
  year: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  salaryType: z.enum(StaffSalaryTypeEnum).optional(),
  status: z.enum(PayrollStatusEnum).optional(),
});

export type FindPayrollsDto = z.infer<typeof FindPayrollsSchema>;

export const PayrollSummarySchema = z.object({
  totalPayrollSpend: z.number(),
  totalPaid: z.number(),
  totalDraft: z.number(),
  paidCount: z.number(),
  draftCount: z.number(),
  totalStaffCount: z.number(),
  monthlySpend: z.number(),
  hourlySpend: z.number(),
});

export type PayrollSummaryAttribute = z.infer<typeof PayrollSummarySchema>;
export type PayrollSummaryDto = z.infer<typeof PayrollSummarySchema>;
