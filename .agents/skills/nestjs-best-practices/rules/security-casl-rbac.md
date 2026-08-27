---
title: Implement Role and Attribute-Based Access Control with CASL
impact: CRITICAL
impactDescription: Enforces declarative role-based and attribute-based permissions across NestJS modules
tags: security, rbac, abac, casl, nest-casl, authorization, guards
---

## Implement Role and Attribute-Based Access Control with CASL

**Impact: CRITICAL (Enforces declarative role-based and attribute-based permissions across NestJS modules)**

Authorization must be managed declaratively using `nest-casl` and `@casl/ability`. Scattered manual checks (e.g. checking `if (user.role !== 'admin')`) lead to permission leaks, duplication, and missing subject attribute checks. Use centralized permission maps (`*.permission.ts`), entity loading hooks (`SubjectBeforeFilterHook`), and controller route decorators (`@UseAbility(...)` with `CaslAccessGuard`).

**Incorrect (manual role checks inside controllers and missing subject hooks):**

```typescript
// Imperative, brittle, and bypasses CASL entity attribute rules
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    // Bad: Manual role and subject ownership check directly in controller
    if (req.user.type !== 'ADMIN' && req.user.sub !== id) {
      throw new ForbiddenException('Cannot access other user profile');
    }
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    // Bad: Duplicated manual auth checks
    if (req.user.type !== 'ADMIN' && req.user.sub !== id) {
      throw new ForbiddenException('Cannot update other user profile');
    }
    return this.userService.update(+id, dto);
  }
}
```

**Correct (declarative nest-casl authorization setup):**

```typescript
// 1. Define global CASL config (src/common/config/casl.config.ts)
import type { JwtPayload } from "@src/auth/dto/jwt-payload.dto.js";
import { UserTypeEnum, type PermissionDto } from "@repo/contracts";
import type { Request } from "express";
import { CaslModule, type AuthorizableUser } from "nest-casl";

export interface AppAuthorizableUser extends AuthorizableUser<string, number> {
  id: number;
  roles: string[];
  userType?: UserTypeEnum;
  permissions?: PermissionDto[];
}

export const caslConfig = CaslModule.forRoot<string, AppAuthorizableUser>({
  superuserRole: UserTypeEnum.ADMIN,
  getUserFromRequest: (request) => {
    const user = (request as unknown as Request).user as JwtPayload | undefined;
    if (!user) return undefined;
    const userType = user.userType ?? user.type;
    return {
      id: Number(user.sub),
      roles: user.roles ?? [userType],
      userType,
      permissions: user.permissions ?? [],
    };
  },
});

// 2. Reusable CASL Registration Helper (src/common/config/casl.helper.ts)
import { Actions, type AbilityCan } from 'nest-casl';
import { hasPermission, ResourceEnum, type PermissionDto } from '@repo/contracts';

export function registerCaslPermissions<Subjects extends object>(
  can: AbilityCan<Subjects, Actions>,
  perms: PermissionDto[] | undefined,
  entity: Subjects,
  resource: ResourceEnum | string,
): void {
  if (hasPermission(perms, Actions.manage, resource)) {
    can(Actions.manage, entity);
    return;
  }
  for (const act of [Actions.read, Actions.create, Actions.update, Actions.delete]) {
    if (hasPermission(perms, act, resource)) {
      can(act, entity);
    }
  }
}

// 3. Feature Permission Map (src/user/user.permission.ts)
import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { User } from './entity/user.entity.js';
import { ResourceEnum } from '@repo/contracts';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, User);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, User, ResourceEnum.USER);
  },

  PORTAL_USER({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    can(Actions.update, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

// 4. Subject Before Filter Hook for Entity Resolution (src/user/user.hook.ts)
import { Inject, Injectable, NotFoundException, type LoggerService } from '@nestjs/common';
import { UserService } from './user.service.js';
import { User } from './entity/user.entity.js';
import type { SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';

@Injectable()
export class UserHook implements SubjectBeforeFilterHook<User, Request> {
  constructor(
    readonly userService: UserService,
    @Inject(APP_LOGGER) private readonly logger: LoggerService
  ) {}

  async run({ params }: Request): Promise<User> {
    const user = await this.userService.findOne(+params.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

// 5. Clean Controller with Guards & UseAbility (src/user/user.controller.ts)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, User)
  @Get()
  findAll(@Query() dto: FindUsersDto) {
    return this.userService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, User, UserHook)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, User, UserHook)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }
}

// 6. Feature Module Setup (src/user/user.module.ts)
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserHook],
})
export class UserModule {}
```

Reference: [nest-casl Documentation](https://github.com/dianavile/nest-casl)
