import {
  CreateGradingRuleSchema,
  UpdateGradingRuleSchema,
  FindGradingRulesSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateGradingRuleDto extends createZodDto(
  CreateGradingRuleSchema,
) {}

export class UpdateGradingRuleDto extends createZodDto(
  UpdateGradingRuleSchema,
) {}

export class FindGradingRulesDto extends createZodDto(
  FindGradingRulesSchema,
) {}
