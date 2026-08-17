import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { Teacher } from './entity/teacher.entity.js';

export type Subjects = InferSubjects<typeof Teacher>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  
  ADMIN({ can }) {
    can(Actions.manage, Teacher);
  },
  admin({ can }) {
    can(Actions.manage, Teacher);
  },
  administrator({ can }) {
    can(Actions.manage, Teacher);
  },
  superadmin({ can }) {
    can(Actions.manage, Teacher);
  },

  CMS({ can }) {
    can(Actions.manage, Teacher);
  },
  cms({ can }) {
    can(Actions.manage, Teacher);
  },

  TEACHER({ user, can }) {
    can(Actions.read, Teacher);
    can(Actions.update, Teacher, { userId: user?.id });
  },
  teacher({ user, can }) {
    can(Actions.read, Teacher);
    can(Actions.update, Teacher, { userId: user?.id });
  },

  STAFF({ can }) {
    can(Actions.read, Teacher);
  },
  staff({ can }) {
    can(Actions.read, Teacher);
  },

  STUDENT({ can }) {
    can(Actions.read, Teacher);
  },
  student({ can }) {
    can(Actions.read, Teacher);
  },

  PORTAL_USER({ can }) {
    can(Actions.read, Teacher);
  },
  portal_user({ can }) {
    can(Actions.read, Teacher);
  },

  CUSTOMER({ can }) {
    can(Actions.read, Teacher);
  },
  customer({ can }) {
    can(Actions.read, Teacher);
  },
};
