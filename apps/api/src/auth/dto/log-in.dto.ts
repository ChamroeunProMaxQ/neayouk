import { LogInSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class LogInDto extends createZodDto(LogInSchema) {}
