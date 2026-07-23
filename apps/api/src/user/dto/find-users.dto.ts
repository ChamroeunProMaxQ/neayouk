import { FindUsersSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class FindUsersDto extends createZodDto(FindUsersSchema) {}
