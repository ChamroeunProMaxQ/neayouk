import { createZodDto } from 'nestjs-zod';
import {
  CreateStaffSchema,
  FindStaffSchema,
  UpdateStaffSchema,
} from '@repo/contracts';

export class CreateStaffDto extends createZodDto(CreateStaffSchema) {}
export class UpdateStaffDto extends createZodDto(UpdateStaffSchema) {}
export class FindStaffDto extends createZodDto(FindStaffSchema) {}
