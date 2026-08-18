import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Student } from './entity/student.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<
  typeof Student | typeof StudentPayment
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Student);
    can(Actions.manage, StudentPayment);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (
      hasPermission(perms, Actions.manage, ResourceEnum.STUDENT) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)
    ) {
      can(Actions.manage, Student);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.STUDENT) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.read, Student);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.STUDENT) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.create, Student);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.STUDENT) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.update, Student);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.STUDENT) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.delete, Student);
      }
    }

    if (
      hasPermission(perms, Actions.manage, ResourceEnum.FEE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.STUDENT)
    ) {
      can(Actions.manage, StudentPayment);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.FEE) ||
        hasPermission(perms, Actions.read, ResourceEnum.STUDENT)
      ) {
        can(Actions.read, StudentPayment);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.FEE) ||
        hasPermission(perms, Actions.create, ResourceEnum.STUDENT)
      ) {
        can(Actions.create, StudentPayment);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.FEE) ||
        hasPermission(perms, Actions.update, ResourceEnum.STUDENT)
      ) {
        can(Actions.update, StudentPayment);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.FEE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.STUDENT)
      ) {
        can(Actions.delete, StudentPayment);
      }
    }
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

