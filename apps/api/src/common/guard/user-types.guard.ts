import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserTypeEnum } from '@repo/shared';
import { USER_TYPES_KEY } from '../decorator/user-type.decorator.js';

@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireUserTypes = this.reflector.getAllAndOverride<UserTypeEnum[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireUserTypes) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requireUserTypes.some((type) => user.type?.includes(type));
  }
}
