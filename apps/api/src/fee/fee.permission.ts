import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { FeeStructure } from './entity/fee-structure.entity.js';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { SchoolExpense } from './entity/school-expense.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<
  typeof FeeStructure | typeof StudentPayment | typeof SchoolExpense
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, FeeStructure);
    can(Actions.manage, StudentPayment);
    can(Actions.manage, SchoolExpense);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (
      hasPermission(perms, Actions.manage, ResourceEnum.FEE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ALL)
    ) {
      can(Actions.manage, FeeStructure);
      can(Actions.manage, StudentPayment);
      can(Actions.manage, SchoolExpense);
    } else {
      if (hasPermission(perms, Actions.read, ResourceEnum.FEE)) {
        can(Actions.read, FeeStructure);
        can(Actions.read, StudentPayment);
        can(Actions.read, SchoolExpense);
      }
      if (hasPermission(perms, Actions.create, ResourceEnum.FEE)) {
        can(Actions.create, FeeStructure);
        can(Actions.create, StudentPayment);
        can(Actions.create, SchoolExpense);
      }
      if (hasPermission(perms, Actions.update, ResourceEnum.FEE)) {
        can(Actions.update, FeeStructure);
        can(Actions.update, StudentPayment);
        can(Actions.update, SchoolExpense);
      }
      if (hasPermission(perms, Actions.delete, ResourceEnum.FEE)) {
        can(Actions.delete, FeeStructure);
        can(Actions.delete, StudentPayment);
        can(Actions.delete, SchoolExpense);
      }
    }
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
