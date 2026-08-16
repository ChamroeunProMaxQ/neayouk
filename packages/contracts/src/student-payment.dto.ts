import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { PaymentStatusEnum, PaymentMethodEnum } from "./payment-status.enum.js";

export const StudentPaymentSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  studentId: z.number(),
  classId: z.number().nullable().optional(),
  billingYear: z.number(),
  billingMonth: z.number().min(1).max(12),
  amountDue: z.coerce.number().default(0),
  amountPaid: z.coerce.number().default(0),
  discountApplied: z.coerce.number().default(0),
  status: z.enum(PaymentStatusEnum).default(PaymentStatusEnum.PAID),
  paymentMethod: z.enum(PaymentMethodEnum).default(PaymentMethodEnum.CASH).optional(),
  receiptNumber: z.string().nullable().optional(),
  paidAt: z.date().or(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  recordedBy: z.number().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type StudentPaymentAttribute = z.infer<typeof StudentPaymentSchema>;

export const UnpaidMonthItemSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  monthName: z.string(),
  amountDue: z.number(),
  status: z.enum(PaymentStatusEnum),
});

export type UnpaidMonthItem = z.infer<typeof UnpaidMonthItemSchema>;

export const StudentPaymentSummarySchema = z.object({
  studentId: z.number(),
  totalPaidAmount: z.number(),
  totalUnpaidMonths: z.number(),
  unpaidMonthsList: z.array(UnpaidMonthItemSchema),
  totalOutstandingAmount: z.number(),
  lastPaymentDate: z.date().or(z.string()).nullable().optional(),
  payments: z.array(StudentPaymentSchema).optional(),
});

export type StudentPaymentSummary = z.infer<typeof StudentPaymentSummarySchema>;

export const RecordPaymentSchema = z.object({
  studentId: z.coerce.number(),
  classId: z.coerce.number().optional(),
  billingYear: z.coerce.number().int().min(2000).max(2100),
  billingMonth: z.coerce.number().int().min(1).max(12),
  amountDue: z.coerce.number().min(0).optional(),
  amountPaid: z.coerce.number().min(0, "Amount must be zero or positive"),
  discountApplied: z.coerce.number().min(0).optional(),
  status: z.enum(PaymentStatusEnum).optional(),
  paymentMethod: z.enum(PaymentMethodEnum).default(PaymentMethodEnum.CASH).optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.date().or(z.string()).optional(),
});

export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;

export const BatchMonthPaymentItemSchema = z.object({
  billingYear: z.coerce.number().int().min(2000).max(2100),
  billingMonth: z.coerce.number().int().min(1).max(12),
  amountPaid: z.coerce.number().min(0),
  discountApplied: z.coerce.number().min(0).default(0).optional(),
});

export const BatchRecordPaymentSchema = z.object({
  studentId: z.coerce.number(),
  classId: z.coerce.number().optional(),
  months: z.array(BatchMonthPaymentItemSchema).min(1, "At least one month must be selected"),
  paymentMethod: z.enum(PaymentMethodEnum).default(PaymentMethodEnum.CASH).optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.date().or(z.string()).optional(),
});

export type BatchRecordPaymentDto = z.infer<typeof BatchRecordPaymentSchema>;

export const FindStudentPaymentsSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'billingYear', 'billingMonth', 'paidAt', 'createdAt'], 'id'),
  studentId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  billingYear: z.coerce.number().optional(),
  billingMonth: z.coerce.number().optional(),
  status: z.enum(PaymentStatusEnum).optional(),
});

export type FindStudentPaymentsDto = z.infer<typeof FindStudentPaymentsSchema>;
