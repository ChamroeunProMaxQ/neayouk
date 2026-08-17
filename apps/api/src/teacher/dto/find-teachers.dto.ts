import { FindTeachersSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindTeachersDto extends createZodDto(FindTeachersSchema) {}
