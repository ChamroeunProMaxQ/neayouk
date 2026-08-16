import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserTypeEnum } from '@repo/contracts';
import { USER_TYPES_KEY } from '@src/common/decorator/user-type.decorator.js';

@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {

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
    const userType = user?.userType ?? user?.type;

    if (!user || !userType) {
      return false;
    }

    return requireUserTypes.some((type) => {
      if (type === userType) return true;
      if (type === 'CUSTOMER' && userType === 'PORTAL_USER') return true;
      if (type === 'PORTAL_USER' && userType === 'CUSTOMER') return true;
      return false;
    });
  }
}
