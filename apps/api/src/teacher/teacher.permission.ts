import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Teacher } from './entity/teacher.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<typeof Teacher>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Teacher);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (
      hasPermission(perms, Actions.manage, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ATTENDANCE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.EXAMINATION) ||
      hasPermission(perms, Actions.manage, ResourceEnum.HR)
    ) {
      can(Actions.manage, Teacher);
      return;
    }

    if (
      hasPermission(perms, Actions.read, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.read, ResourceEnum.ATTENDANCE) ||
      hasPermission(perms, Actions.read, ResourceEnum.EXAMINATION) ||
      hasPermission(perms, Actions.read, ResourceEnum.HR)
    ) {
      can(Actions.read, Teacher);
    }
    if (
      hasPermission(perms, Actions.create, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.create, ResourceEnum.HR)
    ) {
      can(Actions.create, Teacher);
    }
    if (
      hasPermission(perms, Actions.update, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.update, ResourceEnum.HR)
    ) {
      can(Actions.update, Teacher);
    }
    if (
      hasPermission(perms, Actions.delete, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.delete, ResourceEnum.HR)
    ) {
      can(Actions.delete, Teacher);
    }
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Teacher);
    can(Actions.update, Teacher, { userId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
