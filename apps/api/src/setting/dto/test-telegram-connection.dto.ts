import { createZodDto } from 'nestjs-zod';
import { TestTelegramConnectionSchema } from '@repo/contracts';

export class TestTelegramConnectionDto extends createZodDto(TestTelegramConnectionSchema) {}
