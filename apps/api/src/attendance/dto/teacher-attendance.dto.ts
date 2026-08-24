import {
  RecordTeacherAttendanceSchema,
  BatchRecordTeacherAttendanceSchema,
  FindTeacherAttendanceSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class RecordTeacherAttendanceDto extends createZodDto(
  RecordTeacherAttendanceSchema,
) {}

export class BatchRecordTeacherAttendanceDto extends createZodDto(
  BatchRecordTeacherAttendanceSchema,
) {}

export class FindTeacherAttendanceDto extends createZodDto(
  FindTeacherAttendanceSchema,
) {}
