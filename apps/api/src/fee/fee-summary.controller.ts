import { Controller, Get, UseGuards } from '@nestjs/common';
import { UseAbility } from 'nest-casl';
import { Actions } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';

import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { FeeSummaryService } from './fee-summary.service.js';

@Controller('admin/fees/summary')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class FeeSummaryController {
  constructor(private readonly service: FeeSummaryService) {}

  @Get()
  @UseAbility(Actions.read, StudentPayment)
  async getSummary() {
    return this.service.getSummary();
  }
}
