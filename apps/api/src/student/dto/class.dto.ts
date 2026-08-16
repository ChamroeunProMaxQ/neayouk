import {
  CreateClassSchema,
  UpdateClassSchema,
  FindClassesSchema,
  AssignStudentClassesSchema,
  PromoteStudentSchema,
  BatchPromoteStudentsSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateClassDto extends createZodDto(CreateClassSchema) {}
export class UpdateClassDto extends createZodDto(UpdateClassSchema) {}
export class FindClassesDto extends createZodDto(FindClassesSchema) {}
export class AssignStudentClassesDto extends createZodDto(AssignStudentClassesSchema) {}
export class PromoteStudentDto extends createZodDto(PromoteStudentSchema) {}
export class BatchPromoteStudentsDto extends createZodDto(BatchPromoteStudentsSchema) {}
