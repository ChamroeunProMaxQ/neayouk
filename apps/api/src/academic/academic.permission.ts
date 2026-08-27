import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { Class } from './entity/class.entity.js';
import { Program } from './entity/program.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<
  typeof Class | typeof Program | typeof ClassTimetable
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, Class);
    can(Actions.manage, Program);
    can(Actions.manage, ClassTimetable);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, Class, ResourceEnum.CLASS);
    registerCaslPermissions(can, perms, Program, ResourceEnum.PROGRAM);
    registerCaslPermissions(can, perms, ClassTimetable, ResourceEnum.TIMETABLE);
  },

  PORTAL_USER({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

