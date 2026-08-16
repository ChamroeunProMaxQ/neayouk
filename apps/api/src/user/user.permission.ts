import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { User } from './entity/user.entity.js';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  // Superuser / Full Admin
  ADMIN({ can }) {
    can(Actions.manage, User);
  },
  admin({ can }) {
    can(Actions.manage, User);
  },

  // CMS Backoffice
  CMS({ can }) {
    can(Actions.manage, User);
  },
  cms({ can }) {
    can(Actions.manage, User);
  },

  // Teacher role
  TEACHER({ can }) {
    can(Actions.read, User);
  },
  teacher({ can }) {
    can(Actions.read, User);
  },

  // Staff role
  STAFF({ can }) {
    can(Actions.read, User);
  },
  staff({ can }) {
    can(Actions.read, User);
  },

  // Student role
  STUDENT({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },
  student({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },

  // Customer / Portal User
  CUSTOMER({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    can(Actions.update, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },
  customer({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    can(Actions.update, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },
  PORTAL_USER({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    can(Actions.update, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },
  portal_user({ user, can, cannot }) {
    can(Actions.read, User, { id: user?.id });
    can(Actions.update, User, { id: user?.id });
    cannot(Actions.create, User);
    cannot(Actions.delete, User);
  },
};