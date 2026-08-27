import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { Student } from './entity/student.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof Student | typeof StudentPayment>;

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
    registerCaslPermissions(can, perms, Student, ResourceEnum.STUDENT);
    registerCaslPermissions(can, perms, StudentPayment, ResourceEnum.INVOICE);
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

