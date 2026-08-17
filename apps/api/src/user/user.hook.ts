import { Inject, Injectable, NotFoundException, UnauthorizedException, type LoggerService } from '@nestjs/common';
import type { UserAttribute } from '@repo/contracts';
import { UserService } from './user.service.js';
import type { AuthorizableUser, SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';

@Injectable()
export class UserHook implements SubjectBeforeFilterHook<UserAttribute, Request> {
    constructor(readonly userService: UserService,
        @Inject(APP_LOGGER)
        private readonly logger: LoggerService
    ) {
        //
    }

    async run({ params }: Request) {
        // this.logger.log(`user hook is running for user ${params.id}`);
        const user = await this.userService.findOne(+params.id);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        return user;
    }
}

@Injectable()
export class AuthUserHook implements SubjectBeforeFilterHook<AuthorizableUser, Request> {
    constructor(readonly userService: UserService,
        @Inject(APP_LOGGER)
        private readonly logger: LoggerService
    ) {

    }

    async run({ user }: Request) {
        console.log('user in req', user?.sub)
        const auth = await this.userService.findOne(+user?.sub!)
        if (!auth) throw new UnauthorizedException();
        return {
            id: auth.id.toString(),
            roles: [auth?.userType]
        } as AuthorizableUser
    }
}