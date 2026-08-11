import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AccessGuard, AccessService } from 'nest-casl';
import { NESTLENS_GATE_SERVICE, CollectorService } from 'nestlens';
import type { NestLensGateService } from '../provider/nestlens-gate.provider.js';

@Injectable()
export class CaslAccessGuard extends AccessGuard {
  constructor(
    private readonly reflectorService: Reflector,
    accessService: AccessService,
    moduleRef: ModuleRef,
    @Optional()
    @Inject(NESTLENS_GATE_SERVICE)
    private readonly gateService?: NestLensGateService,
    @Optional()
    @Inject(CollectorService)
    private readonly collectorService?: CollectorService,
  ) {
    super(reflectorService, accessService, moduleRef);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    let isAllowed = false;
    let errorReason: string | undefined;

    try {
      isAllowed = await super.canActivate(context);
    } catch (err: any) {
      isAllowed = false;
      errorReason = err?.message || String(err);
      this.trackGateCheck(context, false, errorReason, Date.now() - startTime);
      throw err;
    }

    this.trackGateCheck(
      context,
      isAllowed,
      isAllowed ? undefined : 'Access Denied',
      Date.now() - startTime,
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        'You do not have permission to access or modify this resource',
      );
    }

    return true;
  }

  private trackGateCheck(
    context: ExecutionContext,
    allowed: boolean,
    reason?: string,
    duration = 0,
  ) {
    try {
      const req = context.switchToHttp().getRequest();
      const user = req?.user;
      const handler = context.getHandler();
      const controller = context.getClass();

      const ability = this.reflectorService.get('CASL_META_ABILITY', handler) as any;
      const action = ability?.action || handler?.name || req?.method || 'check';
      const subject =
        typeof ability?.subject === 'function'
          ? ability.subject.name
          : typeof ability?.subject === 'string'
            ? ability.subject
            : controller?.name || 'Resource';

      const userId = user?.sub || user?.id || user?.username;

      // 1. Notify NestLens GateWatcher via gateService.can if installed
      if (this.gateService && typeof this.gateService.can === 'function') {
        this.gateService.can('CASL', String(action), String(subject), user || { id: userId });
      }

      // 2. Also send payload directly to CollectorService as a fallback
      if (this.collectorService) {
        const payload = {
          gate: 'CASL',
          action: String(action),
          subject: String(subject),
          allowed,
          userId,
          reason,
          duration,
          context: user
            ? {
              userRoles: user.type ? [user.type] : user.roles,
              userName: user.username,
            }
            : undefined,
        };
        const requestId = req?.nestlensRequestId;
        this.collectorService.collectImmediate('gate', payload, requestId);
        this.collectorService.collect('gate', payload);
      }
    } catch {
      // Ignore if gate recording fails
    }
  }
}
