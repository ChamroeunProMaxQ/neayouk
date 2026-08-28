import {
  FinancialReportQuerySchema,
  AcademicReportQuerySchema,
  AttendanceReportQuerySchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FinancialReportQueryDto extends createZodDto(FinancialReportQuerySchema) {}
export class AcademicReportQueryDto extends createZodDto(AcademicReportQuerySchema) {}
export class AttendanceReportQueryDto extends createZodDto(AttendanceReportQuerySchema) {}
