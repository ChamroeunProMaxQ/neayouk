import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { Permission } from './entity/permission.entity.js';

export type Subjects = InferSubjects<typeof Permission>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  ADMIN({ can }) {
    can(Actions.manage, Permission);
  },
  admin({ can }) {
    can(Actions.manage, Permission);
  },

  CMS({ can }) {
    can(Actions.manage, Permission);
  },
  cms({ can }) {
    can(Actions.manage, Permission);
  },

  TEACHER({ can }) {
    can(Actions.read, Permission);
  },
  teacher({ can }) {
    can(Actions.read, Permission);
  },

  STAFF({ can }) {
    can(Actions.read, Permission);
  },
  staff({ can }) {
    can(Actions.read, Permission);
  },

  STUDENT() {
    // No access
  },
  student() {
    // No access
  },

  CUSTOMER() {
    // No access
  },
  customer() {
    // No access
  },
  PORTAL_USER() {
    // No access
  },
  portal_user() {
    // No access
  },
};
