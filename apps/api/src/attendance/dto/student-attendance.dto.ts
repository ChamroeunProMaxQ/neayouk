import {
  RecordStudentAttendanceSchema,
  BatchRecordStudentAttendanceSchema,
  FindStudentAttendanceSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class RecordStudentAttendanceDto extends createZodDto(
  RecordStudentAttendanceSchema,
) {}

export class BatchRecordStudentAttendanceDto extends createZodDto(
  BatchRecordStudentAttendanceSchema,
) {}

export class FindStudentAttendanceDto extends createZodDto(
  FindStudentAttendanceSchema,
) {}
