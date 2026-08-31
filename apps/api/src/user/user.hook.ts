import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  type LoggerService,
} from '@nestjs/common';
import type { UserAttribute } from '@repo/contracts';
import { UserTypeEnum } from '@repo/contracts';
import { UserService } from './user.service.js';
import type { AuthorizableUser, SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';

@Injectable()
export class UserHook implements SubjectBeforeFilterHook<
  UserAttribute,
  Request
> {
  constructor(
    readonly userService: UserService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {
    //
  }

  async run(req: Request) {
    const { params, user: authUser } = req as any;
    const user = await this.userService.findOne(+params.id);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    // Branch isolation check
    if (authUser && authUser.userType !== UserTypeEnum.SUPER_ADMIN && authUser.branchId) {
      if (user.branchId && user.branchId !== authUser.branchId) {
        throw new ForbiddenException('You can only manage users in your own branch');
      }
    }

    return user;
  }
}

@Injectable()
export class AuthUserHook implements SubjectBeforeFilterHook<
  AuthorizableUser,
  Request
> {
  constructor(
    readonly userService: UserService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async run({ user }: Request) {
    if (!user?.sub) throw new UnauthorizedException();
    const auth = await this.userService.findOne(+user.sub);
    if (!auth) throw new UnauthorizedException();
    return {
      id: auth.id.toString(),
      roles: [auth?.userType],
    } as AuthorizableUser;
  }
}
