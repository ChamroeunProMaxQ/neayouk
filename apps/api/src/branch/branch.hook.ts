import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { UserTypeEnum } from '@repo/contracts';
import { BranchService } from './branch.service.js';
import { Branch } from './entity/branch.entity.js';

@Injectable()
export class BranchHook implements SubjectBeforeFilterHook<
  Branch,
  Request
> {
  constructor(private readonly branchService: BranchService) {}

  async run(req: Request) {
    const { params, user: authUser } = req as any;
    const id = Number(params?.id);
    if (!id || Number.isNaN(id)) {
      return undefined;
    }

    const branch = await this.branchService.findOne(id);
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Branch isolation check: Non-SUPER_ADMIN users can only access their assigned branch
    if (
      authUser &&
      authUser.userType !== UserTypeEnum.SUPER_ADMIN &&
      authUser.userType !== 'SUPER_ADMIN' &&
      authUser.branchId
    ) {
      if (Number(branch.id) !== Number(authUser.branchId)) {
        throw new ForbiddenException('You can only access your assigned branch');
      }
    }

    return Object.assign(new Branch(), branch);
  }
}
