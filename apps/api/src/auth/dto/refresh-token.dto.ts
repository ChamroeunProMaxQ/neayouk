import { RefreshTokenSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
