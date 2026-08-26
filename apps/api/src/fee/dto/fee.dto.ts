import {
  CreateFeeStructureSchema,
  UpdateFeeStructureSchema,
  FindFeeStructuresSchema,
  CreateInvoiceSchema,
  GenerateBatchInvoicesSchema,
  RecordInvoicePaymentSchema,
  RefundPaymentSchema,
  PaymentReminderSchema,
  FindInvoicesSchema,
  CreateSchoolExpenseSchema,
  UpdateSchoolExpenseSchema,
  ApproveSchoolExpenseSchema,
  FindSchoolExpensesSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateFeeStructureDto extends createZodDto(CreateFeeStructureSchema) {}
export class UpdateFeeStructureDto extends createZodDto(UpdateFeeStructureSchema) {}
export class FindFeeStructuresDto extends createZodDto(FindFeeStructuresSchema) {}

export class CreateInvoiceDto extends createZodDto(CreateInvoiceSchema) {}
export class GenerateBatchInvoicesDto extends createZodDto(GenerateBatchInvoicesSchema) {}
export class RecordInvoicePaymentDto extends createZodDto(RecordInvoicePaymentSchema) {}
export class RefundPaymentDto extends createZodDto(RefundPaymentSchema) {}
export class PaymentReminderDto extends createZodDto(PaymentReminderSchema) {}
export class FindInvoicesDto extends createZodDto(FindInvoicesSchema) {}

export class CreateSchoolExpenseDto extends createZodDto(CreateSchoolExpenseSchema) {}
export class UpdateSchoolExpenseDto extends createZodDto(UpdateSchoolExpenseSchema) {}
export class ApproveSchoolExpenseDto extends createZodDto(ApproveSchoolExpenseSchema) {}
export class FindSchoolExpensesDto extends createZodDto(FindSchoolExpensesSchema) {}
