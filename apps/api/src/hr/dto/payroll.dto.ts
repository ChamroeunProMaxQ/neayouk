import { createZodDto } from 'nestjs-zod';
import {
  CreatePayrollSchema,
  FindPayrollsSchema,
  ProcessPayrollPaymentSchema,
  UpdatePayrollSchema,
} from '@repo/contracts';

export class CreatePayrollDto extends createZodDto(CreatePayrollSchema) {}
export class UpdatePayrollDto extends createZodDto(UpdatePayrollSchema) {}
export class FindPayrollsDto extends createZodDto(FindPayrollsSchema) {}
export class ProcessPayrollPaymentDto extends createZodDto(
  ProcessPayrollPaymentSchema,
) {}
