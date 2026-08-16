import { FindRolesSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindRolesDto extends createZodDto(FindRolesSchema) {}
