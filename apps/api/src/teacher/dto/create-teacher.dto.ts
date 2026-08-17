import { CreateTeacherSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateTeacherDto extends createZodDto(CreateTeacherSchema) {}
