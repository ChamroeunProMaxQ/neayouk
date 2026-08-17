import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { Class } from './entity/class.entity.js';
import { Program } from './entity/program.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';

export type Subjects = InferSubjects<
  typeof Class | typeof Program | typeof ClassTimetable
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AuthorizableUser<string, number>
> = {
  ADMIN({ can }) {
    can(Actions.manage, Class);
    can(Actions.manage, Program);
    can(Actions.manage, ClassTimetable);
  },
  admin({ can }) {
    can(Actions.manage, Class);
    can(Actions.manage, Program);
    can(Actions.manage, ClassTimetable);
  },

  CMS({ can }) {
    can(Actions.manage, Class);
    can(Actions.manage, Program);
    can(Actions.manage, ClassTimetable);
  },
  cms({ can }) {
    can(Actions.manage, Class);
    can(Actions.manage, Program);
    can(Actions.manage, ClassTimetable);
  },

  TEACHER({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  teacher({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },

  STAFF({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  staff({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },

  STUDENT({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  student({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },

  PORTAL_USER({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  portal_user({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  CUSTOMER({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
  customer({ can }) {
    can(Actions.read, Class);
    can(Actions.read, Program);
    can(Actions.read, ClassTimetable);
  },
};
