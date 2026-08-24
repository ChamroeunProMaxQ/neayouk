import {
  CreateClassSchema,
  UpdateClassSchema,
  FindClassesSchema,
  AssignStudentClassesSchema,
  PromoteStudentSchema,
  BatchPromoteStudentsSchema,
  CreateClassTimetableSchema,
  UpdateClassTimetableSchema,
  FindClassTimetablesSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateClassDto extends createZodDto(CreateClassSchema) {}
export class UpdateClassDto extends createZodDto(UpdateClassSchema) {}
export class FindClassesDto extends createZodDto(FindClassesSchema) {}
export class AssignStudentClassesDto extends createZodDto(
  AssignStudentClassesSchema,
) {}
export class PromoteStudentDto extends createZodDto(PromoteStudentSchema) {}
export class BatchPromoteStudentsDto extends createZodDto(
  BatchPromoteStudentsSchema,
) {}

export class CreateClassTimetableDto extends createZodDto(
  CreateClassTimetableSchema,
) {}
export class UpdateClassTimetableDto extends createZodDto(
  UpdateClassTimetableSchema,
) {}
export class FindClassTimetablesDto extends createZodDto(
  FindClassTimetablesSchema,
) {}
