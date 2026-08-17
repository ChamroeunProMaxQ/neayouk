import {
  CreateProgramSchema,
  UpdateProgramSchema,
  FindProgramsSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateProgramDto extends createZodDto(CreateProgramSchema) {}
export class UpdateProgramDto extends createZodDto(UpdateProgramSchema) {}
export class FindProgramsDto extends createZodDto(FindProgramsSchema) {}
