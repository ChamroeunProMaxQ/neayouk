import { createZodDto } from 'nestjs-zod';
import { FindBranchesSchema } from '@repo/contracts';

export class FindBranchesDto extends createZodDto(FindBranchesSchema) {}
