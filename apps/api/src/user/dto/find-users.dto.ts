import { FindUsersSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindUsersDto extends createZodDto(FindUsersSchema) {}
