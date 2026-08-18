import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Role } from './entity/role.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<typeof Role>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Role);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (hasPermission(perms, Actions.manage, ResourceEnum.ROLE)) {
      can(Actions.manage, Role);
      return;
    }

    if (hasPermission(perms, Actions.read, ResourceEnum.ROLE)) {
      can(Actions.read, Role);
    }
    if (hasPermission(perms, Actions.create, ResourceEnum.ROLE)) {
      can(Actions.create, Role);
    }
    if (hasPermission(perms, Actions.update, ResourceEnum.ROLE)) {
      can(Actions.update, Role);
    }
    if (hasPermission(perms, Actions.delete, ResourceEnum.ROLE)) {
      can(Actions.delete, Role);
    }
  },

  PORTAL_USER() {
    // No role management access
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

