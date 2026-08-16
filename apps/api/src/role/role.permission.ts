import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { Role } from './entity/role.entity.js';

export type Subjects = InferSubjects<typeof Role>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  ADMIN({ can }) {
    can(Actions.manage, Role);
  },
  admin({ can }) {
    can(Actions.manage, Role);
  },

  CMS({ can }) {
    can(Actions.manage, Role);
  },
  cms({ can }) {
    can(Actions.manage, Role);
  },

  TEACHER({ can }) {
    can(Actions.read, Role);
  },
  teacher({ can }) {
    can(Actions.read, Role);
  },

  STAFF({ can }) {
    can(Actions.read, Role);
  },
  staff({ can }) {
    can(Actions.read, Role);
  },

  STUDENT() {
    // No role management access
  },
  student() {
    // No role management access
  },

  CUSTOMER() {
    // No role management access
  },
  customer() {
    // No role management access
  },
  PORTAL_USER() {
    // No role management access
  },
  portal_user() {
    // No role management access
  },
};
