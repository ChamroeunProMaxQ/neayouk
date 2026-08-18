import { Inject, Injectable, NotFoundException, type LoggerService } from '@nestjs/common';
import type { SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { LeaveRequestService } from './leave-request.service.js';
import type { LeaveRequestAttribute } from '@repo/contracts';

@Injectable()
export class LeaveRequestHook implements SubjectBeforeFilterHook<LeaveRequestAttribute, Request> {
  constructor(
    private readonly leaveRequestService: LeaveRequestService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async run({ params }: Request) {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return undefined;
    }
    const leaveRequest = await this.leaveRequestService.findOne(id);
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }
    return leaveRequest;
  }
}
