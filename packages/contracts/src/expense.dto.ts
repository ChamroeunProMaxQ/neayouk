import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { PaymentMethodEnum } from "./payment-status.enum.js";

export enum ExpenseCategoryEnum {
  SALARY = "SALARY",
  UTILITIES = "UTILITIES",
  MAINTENANCE = "MAINTENANCE",
  SUPPLIES = "SUPPLIES",
  TRANSPORT = "TRANSPORT",
  EVENTS = "EVENTS",
  EQUIPMENT = "EQUIPMENT",
  OTHER = "OTHER",
}

export enum ExpenseStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
}

export const SchoolExpenseSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  category: z.nativeEnum(ExpenseCategoryEnum),
  amount: z.coerce.number(),
  expenseDate: z.date().or(z.string()),
  vendor: z.string().nullable().optional(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).default(PaymentMethodEnum.CASH),
  status: z.nativeEnum(ExpenseStatusEnum).default(ExpenseStatusEnum.PENDING),
  receiptRef: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recordedBy: z.number().nullable().optional(),
  approvedBy: z.number().nullable().optional(),
  approvedAt: z.date().or(z.string()).nullable().optional(),
  recordedByName: z.string().optional(),
  approvedByName: z.string().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type SchoolExpenseAttribute = z.infer<typeof SchoolExpenseSchema>;

export const CreateSchoolExpenseSchema = z.object({
  title: z.string().min(1, "Expense title is required"),
  category: z.nativeEnum(ExpenseCategoryEnum).default(ExpenseCategoryEnum.OTHER),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  expenseDate: z.date().or(z.string()).optional(),
  vendor: z.string().optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).default(PaymentMethodEnum.CASH).optional(),
  receiptRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateSchoolExpenseDto = z.infer<typeof CreateSchoolExpenseSchema>;

export const UpdateSchoolExpenseSchema = CreateSchoolExpenseSchema.partial();

export type UpdateSchoolExpenseDto = z.infer<typeof UpdateSchoolExpenseSchema>;

export const ApproveSchoolExpenseSchema = z.object({
  status: z.enum([ExpenseStatusEnum.APPROVED, ExpenseStatusEnum.PAID, ExpenseStatusEnum.REJECTED]),
  notes: z.string().optional(),
});

export type ApproveSchoolExpenseDto = z.infer<typeof ApproveSchoolExpenseSchema>;

export const FindSchoolExpensesSchema = PaginationSchema.extend({
  ...createSortSchema(["id", "title", "category", "amount", "expenseDate", "status", "createdAt"], "id"),
  search: z.string().optional(),
  category: z.nativeEnum(ExpenseCategoryEnum).optional(),
  status: z.nativeEnum(ExpenseStatusEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type FindSchoolExpensesDto = z.infer<typeof FindSchoolExpensesSchema>;

export const FeeSummarySchema = z.object({
  totalRevenueCollected: z.number(),
  totalOutstandingOverdue: z.number(),
  totalApprovedExpenses: z.number(),
  netOperatingBalance: z.number(),
  pendingExpensesCount: z.number(),
  unpaidInvoicesCount: z.number(),
});

export type FeeSummary = z.infer<typeof FeeSummarySchema>;
