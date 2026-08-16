import {
  RecordPaymentSchema,
  BatchRecordPaymentSchema,
  FindStudentPaymentsSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class RecordPaymentDto extends createZodDto(RecordPaymentSchema) {}
export class BatchRecordPaymentDto extends createZodDto(BatchRecordPaymentSchema) {}
export class FindStudentPaymentsDto extends createZodDto(FindStudentPaymentsSchema) {}
