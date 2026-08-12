import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AccessGuard, AccessService } from 'nest-casl';

@Injectable()
export class CaslAccessGuard extends AccessGuard {
  constructor(
    reflectorService: Reflector,
    accessService: AccessService,
    moduleRef: ModuleRef,
  ) {
    super(reflectorService, accessService, moduleRef);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    return await super.canActivate(context);
  }
}
