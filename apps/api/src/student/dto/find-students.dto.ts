import { FindStudentsSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindStudentsDto extends createZodDto(FindStudentsSchema) {}
