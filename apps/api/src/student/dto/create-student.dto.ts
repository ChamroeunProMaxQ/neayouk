import { CreateStudentSchema, UpdateStudentSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateStudentDto extends createZodDto(CreateStudentSchema) {}
export class UpdateStudentDto extends createZodDto(UpdateStudentSchema) {}
