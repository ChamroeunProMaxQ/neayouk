import { CreateUserSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
