import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { User } from './entity/user.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  // 1. Platform SuperAdmin: Full access across all branches
  SUPER_ADMIN({ can }) {
    can(Actions.manage, User);
  },

  // 2. Branch Admin: Full access strictly within their branch
  ADMIN({ user, can }) {
    if (user?.branchId) {
      can(Actions.manage, User, { branchId: user.branchId });
    } else {
      can(Actions.manage, User);
    }
  },

  // 3. CMS: Evaluates dynamic database permissions assigned to the user
  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, User, ResourceEnum.USER);
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

