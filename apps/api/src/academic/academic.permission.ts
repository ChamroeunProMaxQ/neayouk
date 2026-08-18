import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { Class } from './entity/class.entity.js';
import { Program } from './entity/program.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

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

    if (hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)) {
      can(Actions.manage, Class);
      can(Actions.manage, Program);
      can(Actions.manage, ClassTimetable);
      return;
    }

    if (hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)) {
      can(Actions.read, Class);
      can(Actions.read, Program);
      can(Actions.read, ClassTimetable);
    }
    if (hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)) {
      can(Actions.create, Class);
      can(Actions.create, Program);
      can(Actions.create, ClassTimetable);
    }
    if (hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)) {
      can(Actions.update, Class);
      can(Actions.update, Program);
      can(Actions.update, ClassTimetable);
    }
    if (hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)) {
      can(Actions.delete, Class);
      can(Actions.delete, Program);
      can(Actions.delete, ClassTimetable);
    }
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

