import { type Permissions, Actions } from 'nest-casl';
import { ResourceEnum } from '@repo/contracts';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = 'setting';

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  SUPER_ADMIN({ can }) {
    can(Actions.manage, 'setting');
  },

  ADMIN({ user, can }) {
    if (user?.branchId) {
      can(Actions.read, 'setting');
      can(Actions.update, 'setting');
    }
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, 'setting', ResourceEnum.SETTING);
  },

  PORTAL_USER() {
    // Portal users have no setting permissions
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
