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

    // Class & Academic Year
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.CLASS) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)
    ) {
      can(Actions.manage, Class);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC_YEAR) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.read, Class);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.create, Class);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.update, Class);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.delete, Class);
      }
    }

    // Program & Curriculum
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.PROGRAM) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)
    ) {
      can(Actions.manage, Program);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.PROGRAM) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.read, Program);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.PROGRAM) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.create, Program);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.PROGRAM) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.update, Program);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.PROGRAM) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.delete, Program);
      }
    }

    // Timetable
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.TIMETABLE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.CLASS) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)
    ) {
      can(Actions.manage, ClassTimetable);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.TIMETABLE) ||
        hasPermission(perms, Actions.read, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.read, ClassTimetable);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.TIMETABLE) ||
        hasPermission(perms, Actions.create, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.create, ClassTimetable);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.TIMETABLE) ||
        hasPermission(perms, Actions.update, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.update, ClassTimetable);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.TIMETABLE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.CLASS) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.delete, ClassTimetable);
      }
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

