import { createZodDto } from 'nestjs-zod';
import { UpdateBranchSchema } from '@repo/contracts';

export class UpdateBranchDto extends createZodDto(UpdateBranchSchema) {}
