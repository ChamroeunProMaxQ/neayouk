import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { PaymentStatusEnum, PaymentMethodEnum } from "./payment-status.enum.js";
import { StudentSchema } from "./student.dto.js";

export const InvoiceItemSchema = z.object({
  id: z.number().optional(),
  invoiceId: z.number().optional(),
  feeStructureId: z.number().nullable().optional(),
  title: z.string().min(1, "Item title is required"),
  amount: z.coerce.number().min(0, "Item amount must be non-negative"),
  createdAt: z.date().or(z.string()).optional(),
});

export type InvoiceItemAttribute = z.infer<typeof InvoiceItemSchema>;

export const StudentInvoiceSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  invoiceNumber: z.string(),
  studentId: z.number(),
  classId: z.number().nullable().optional(),
  billingYear: z.number(),
  billingMonth: z.number().min(1).max(12),
  issueDate: z.date().or(z.string()),
  dueDate: z.date().or(z.string()).nullable().optional(),
  subtotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  totalAmount: z.coerce.number().default(0),
  amountPaid: z.coerce.number().default(0),
  status: z.nativeEnum(PaymentStatusEnum).default(PaymentStatusEnum.UNPAID),
  notes: z.string().nullable().optional(),
  items: z.array(InvoiceItemSchema).optional(),
  studentName: z.string().optional(),
  studentCode: z.string().optional(),
  className: z.string().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type StudentInvoiceAttribute = z.infer<typeof StudentInvoiceSchema>;

export const CreateInvoiceItemSchema = z.object({
  feeStructureId: z.coerce.number().optional().nullable(),
  title: z.string().min(1, "Item title is required"),
  amount: z.coerce.number().min(0, "Amount must be zero or positive"),
});

export const CreateInvoiceSchema = z.object({
  studentId: z.coerce.number(),
  classId: z.coerce.number().optional().nullable(),
  billingYear: z.coerce.number().int().min(2000).max(2100),
  billingMonth: z.coerce.number().int().min(1).max(12),
  issueDate: z.date().or(z.string()).optional(),
  dueDate: z.date().or(z.string()).optional(),
  discountAmount: z.coerce.number().min(0).default(0).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(CreateInvoiceItemSchema).min(1, "At least one invoice line item is required"),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;

export const GenerateBatchInvoicesSchema = z.object({
  studentIds: z.array(z.coerce.number()).min(1, "At least one student must be selected"),
  classId: z.coerce.number().optional().nullable(),
  billingYear: z.coerce.number().int().min(2000).max(2100),
  billingMonth: z.coerce.number().int().min(1).max(12),
  dueDate: z.date().or(z.string()).optional(),
  discountAmount: z.coerce.number().min(0).default(0).optional(),
  feeStructureIds: z.array(z.coerce.number()).optional(),
  customItems: z.array(CreateInvoiceItemSchema).optional(),
  notes: z.string().optional().nullable(),
});

export type GenerateBatchInvoicesDto = z.infer<typeof GenerateBatchInvoicesSchema>;

export const RecordInvoicePaymentSchema = z.object({
  invoiceId: z.coerce.number().optional(),
  amountPaid: z.coerce.number().min(0.01, "Payment amount must be greater than zero"),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).default(PaymentMethodEnum.CASH),
  receiptNumber: z.string().optional(),
  paidAt: z.date().or(z.string()).optional(),
  notes: z.string().optional(),
});

export type RecordInvoicePaymentDto = z.infer<typeof RecordInvoicePaymentSchema>;

export const RefundPaymentSchema = z.object({
  invoiceId: z.coerce.number().optional(),
  amount: z.coerce.number().min(0.01, "Refund amount must be greater than zero"),
  reason: z.string().min(1, "Refund reason is required"),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).optional(),
});

export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;

export const PaymentReminderSchema = z.object({
  invoiceId: z.coerce.number().optional(),
  channel: z.string().default("IN_APP"),
  notes: z.string().optional(),
});

export type PaymentReminderDto = z.infer<typeof PaymentReminderSchema>;

export const FindInvoicesSchema = PaginationSchema.extend({
  ...createSortSchema(["id", "invoiceNumber", "billingYear", "billingMonth", "totalAmount", "status", "createdAt"], "id"),
  search: z.string().optional(),
  studentId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  billingYear: z.coerce.number().optional(),
  billingMonth: z.coerce.number().optional(),
  status: z.nativeEnum(PaymentStatusEnum).optional(),
});

export type FindInvoicesDto = z.infer<typeof FindInvoicesSchema>;
