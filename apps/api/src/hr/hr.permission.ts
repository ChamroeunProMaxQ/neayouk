import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { Staff } from './entity/staff.entity.js';
import { Payroll } from './entity/payroll.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof Staff | typeof Payroll>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Staff);
    can(Actions.manage, Payroll);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, Staff, ResourceEnum.STAFF);
    registerCaslPermissions(can, perms, Payroll, ResourceEnum.PAYROLL);
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Staff);
    can(Actions.read, Payroll, { staffId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

