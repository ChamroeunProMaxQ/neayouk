import { UpdateRoleSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
