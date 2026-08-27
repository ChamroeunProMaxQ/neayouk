import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Staff } from './entity/staff.entity.js';
import { Payroll } from './entity/payroll.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

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

    if (
      hasPermission(perms, Actions.manage, ResourceEnum.HR) ||
      hasPermission(perms, Actions.manage, ResourceEnum.TEACHER)
    ) {
      can(Actions.manage, Staff);
      can(Actions.manage, Payroll);
      return;
    }

    if (
      hasPermission(perms, Actions.read, ResourceEnum.HR) ||
      hasPermission(perms, Actions.read, ResourceEnum.TEACHER)
    ) {
      can(Actions.read, Staff);
      can(Actions.read, Payroll);
    }
    if (
      hasPermission(perms, Actions.create, ResourceEnum.HR) ||
      hasPermission(perms, Actions.create, ResourceEnum.TEACHER)
    ) {
      can(Actions.create, Staff);
      can(Actions.create, Payroll);
    }
    if (
      hasPermission(perms, Actions.update, ResourceEnum.HR) ||
      hasPermission(perms, Actions.update, ResourceEnum.TEACHER)
    ) {
      can(Actions.update, Staff);
      can(Actions.update, Payroll);
    }
    if (
      hasPermission(perms, Actions.delete, ResourceEnum.HR) ||
      hasPermission(perms, Actions.delete, ResourceEnum.TEACHER)
    ) {
      can(Actions.delete, Staff);
      can(Actions.delete, Payroll);
    }
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Staff);
    can(Actions.read, Payroll, { staffId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
