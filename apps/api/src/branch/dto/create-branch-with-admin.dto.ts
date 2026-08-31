import { createZodDto } from 'nestjs-zod';
import { CreateBranchWithAdminSchema } from '@repo/contracts';

export class CreateBranchWithAdminDto extends createZodDto(CreateBranchWithAdminSchema) {}
