import { RefreshTokenSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
