import { createZodDto } from 'nestjs-zod';
import { UpdateSchoolProfileSchema } from '@repo/contracts';

export class UpdateSchoolProfileDto extends createZodDto(UpdateSchoolProfileSchema) {}
