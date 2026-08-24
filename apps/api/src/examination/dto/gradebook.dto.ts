import {
  GetGradebookMatrixSchema,
  BatchSaveGradebookSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class GetGradebookMatrixDto extends createZodDto(
  GetGradebookMatrixSchema,
) {}

export class BatchSaveGradebookDto extends createZodDto(
  BatchSaveGradebookSchema,
) {}
