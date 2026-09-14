import { createZodDto } from 'nestjs-zod';
import { UpdateTelegramIntegrationSchema } from '@repo/contracts';

export class UpdateTelegramIntegrationDto extends createZodDto(UpdateTelegramIntegrationSchema) {}
