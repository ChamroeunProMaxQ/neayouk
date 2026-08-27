import {
  Inject,
  Injectable,
  NotFoundException,
  type LoggerService,
} from '@nestjs/common';
import type { SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { StaffService } from './staff.service.js';
import { PayrollService } from './payroll.service.js';
import type { PayrollAttribute, StaffAttribute } from '@repo/contracts';

@Injectable()
export class StaffHook implements SubjectBeforeFilterHook<
  StaffAttribute,
  Request
> {
  constructor(
    private readonly staffService: StaffService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async run({ params }: Request) {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return undefined;
    }
    const staff = await this.staffService.findOne(id);
    if (!staff) {
      throw new NotFoundException('staff not found');
    }
    return staff;
  }
}

@Injectable()
export class PayrollHook implements SubjectBeforeFilterHook<
  PayrollAttribute,
  Request
> {
  constructor(
    private readonly payrollService: PayrollService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async run({ params }: Request) {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return undefined;
    }
    const payroll = await this.payrollService.findOne(id);
    if (!payroll) {
      throw new NotFoundException('payroll not found');
    }
    return payroll;
  }
}
