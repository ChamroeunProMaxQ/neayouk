import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { FeeStructure } from './entity/fee-structure.entity.js';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { SchoolExpense } from './entity/school-expense.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

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
    registerCaslPermissions(can, perms, FeeStructure, ResourceEnum.FEE_STRUCTURE);
    registerCaslPermissions(can, perms, StudentPayment, ResourceEnum.INVOICE);
    registerCaslPermissions(can, perms, SchoolExpense, ResourceEnum.EXPENSE);
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

