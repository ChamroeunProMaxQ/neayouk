import { FindPermissionsSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindPermissionsDto extends createZodDto(FindPermissionsSchema) {}
