import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { Branch } from './entity/branch.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof Branch>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  SUPER_ADMIN({ can }) {
    can(Actions.manage, Branch);
  },

  ADMIN({ user, can }) {
    if (user?.branchId) {
      can(Actions.read, Branch, { id: user.branchId });
      can(Actions.update, Branch, { id: user.branchId });
    }
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, Branch, ResourceEnum.BRANCH);
  },

  PORTAL_USER({ user, can }) {
    if (user?.branchId) {
      can(Actions.read, Branch, { id: user.branchId });
    }
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
