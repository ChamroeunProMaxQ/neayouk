import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AccessGuard, AccessService } from 'nest-casl';
import { isNestLensRequest } from '@src/common/helper/nestlens.helper.js';

@Injectable()
export class CaslAccessGuard extends AccessGuard {
  constructor(
    private readonly reflectorService: Reflector,
    accessService: AccessService,
    moduleRef: ModuleRef,
  ) {
    super(reflectorService, accessService, moduleRef);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isNestLensRequest(context)) {
      return true;
    }

    return await super.canActivate(context);
  }
}
