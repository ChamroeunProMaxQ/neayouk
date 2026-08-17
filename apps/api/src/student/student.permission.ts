import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { Student } from './entity/student.entity.js';
import { StudentPayment } from './entity/student-payment.entity.js';

export type Subjects = InferSubjects<
  typeof Student | typeof StudentPayment
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  ADMIN({ can }) {
    can(Actions.manage, Student);
    can(Actions.manage, StudentPayment);
  },
  admin({ can }) {
    can(Actions.manage, Student);
    can(Actions.manage, StudentPayment);
  },

  CMS({ can }) {
    can(Actions.manage, Student);
    can(Actions.manage, StudentPayment);
  },
  cms({ can }) {
    can(Actions.manage, Student);
    can(Actions.manage, StudentPayment);
  },

  TEACHER({ can }) {
    can(Actions.read, Student);
    can(Actions.read, StudentPayment);
  },
  teacher({ can }) {
    can(Actions.read, Student);
    can(Actions.read, StudentPayment);
  },

  STAFF({ can }) {
    can(Actions.read, Student);
    can(Actions.read, StudentPayment);
    can(Actions.create, StudentPayment);
  },
  staff({ can }) {
    can(Actions.read, Student);
    can(Actions.read, StudentPayment);
    can(Actions.create, StudentPayment);
  },

  STUDENT({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },
  student({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },
  portal_user({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },
  CUSTOMER({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },
  customer({ user, can }) {
    can(Actions.read, Student, { id: user?.id });
    can(Actions.read, StudentPayment, { studentId: user?.id });
  },
};
