import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserTypeEnum } from '@repo/shared';
import { USER_TYPES_KEY } from '../decorator/user-type.decorator.js';
import { isNestLensRequest } from '../helper/nestlens.helper.js';

@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isNestLensRequest(context)) {
      return true;
    }

    const handler = context.getHandler();
    if (!handler) {
      return true;
    }

    const requireUserTypes = this.reflector.getAllAndOverride<UserTypeEnum[]>(
      USER_TYPES_KEY,
      [handler, context.getClass()],
    );
    if (!requireUserTypes) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.type) {
      return false;
    }

    return requireUserTypes.some((type) => user.type?.includes(type));
  }
}
