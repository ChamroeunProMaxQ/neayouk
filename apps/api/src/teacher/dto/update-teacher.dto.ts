import { UpdateTeacherSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateTeacherDto extends createZodDto(UpdateTeacherSchema) {}
