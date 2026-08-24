import {
  CreateLeaveRequestSchema,
  UpdateLeaveRequestSchema,
  ReviewLeaveRequestSchema,
  FindLeaveRequestsSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateLeaveRequestDto extends createZodDto(
  CreateLeaveRequestSchema,
) {}

export class UpdateLeaveRequestDto extends createZodDto(
  UpdateLeaveRequestSchema,
) {}

export class ReviewLeaveRequestDto extends createZodDto(
  ReviewLeaveRequestSchema,
) {}

export class FindLeaveRequestsDto extends createZodDto(
  FindLeaveRequestsSchema,
) {}
