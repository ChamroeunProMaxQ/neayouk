import { UpdateUserSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
