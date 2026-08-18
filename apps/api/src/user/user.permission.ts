import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { User } from './entity/user.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  // 1. Full Admin / Superuser
  ADMIN({ can }) {
    can(Actions.manage, User);
  },

  // 2. CMS: Evaluates dynamic database permissions assigned to the user
  CMS({ user, can }) {
    const perms = user?.permissions;

    if (hasPermission(perms, Actions.manage, ResourceEnum.USER)) {
      can(Actions.manage, User);
      return;
    }

    if (hasPermission(perms, Actions.read, ResourceEnum.USER)) {
      can(Actions.read, User);
    }
    if (hasPermission(perms, Actions.create, ResourceEnum.USER)) {
      can(Actions.create, User);
    }
    if (hasPermission(perms, Actions.update, ResourceEnum.USER)) {
      can(Actions.update, User);
    }
    if (hasPermission(perms, Actions.delete, ResourceEnum.USER)) {
      can(Actions.delete, User);
    }
  },

  // 3. Portal User / Customer: Self-service access
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