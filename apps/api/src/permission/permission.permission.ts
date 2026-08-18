import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Permission } from './entity/permission.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<typeof Permission>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Permission);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (hasPermission(perms, Actions.manage, ResourceEnum.PERMISSION)) {
      can(Actions.manage, Permission);
      return;
    }

    if (hasPermission(perms, Actions.read, ResourceEnum.PERMISSION)) {
      can(Actions.read, Permission);
    }
    if (hasPermission(perms, Actions.create, ResourceEnum.PERMISSION)) {
      can(Actions.create, Permission);
    }
    if (hasPermission(perms, Actions.update, ResourceEnum.PERMISSION)) {
      can(Actions.update, Permission);
    }
    if (hasPermission(perms, Actions.delete, ResourceEnum.PERMISSION)) {
      can(Actions.delete, Permission);
    }
  },

  PORTAL_USER() {
    // No access
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

