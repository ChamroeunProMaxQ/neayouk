import { CreateRoleSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
