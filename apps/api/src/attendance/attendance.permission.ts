import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { StudentAttendance } from './entity/student-attendance.entity.js';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { LeaveRequest } from './entity/leave-request.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<
  typeof StudentAttendance | typeof TeacherAttendance | typeof LeaveRequest
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, StudentAttendance);
    can(Actions.manage, TeacherAttendance);
    can(Actions.manage, LeaveRequest);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    if (hasPermission(perms, Actions.manage, ResourceEnum.ATTENDANCE)) {
      can(Actions.manage, StudentAttendance);
      can(Actions.manage, TeacherAttendance);
      can(Actions.manage, LeaveRequest);
      return;
    }

    if (hasPermission(perms, Actions.read, ResourceEnum.ATTENDANCE)) {
      can(Actions.read, StudentAttendance);
      can(Actions.read, TeacherAttendance);
      can(Actions.read, LeaveRequest);
    }
    if (hasPermission(perms, Actions.create, ResourceEnum.ATTENDANCE)) {
      can(Actions.create, StudentAttendance);
      can(Actions.create, TeacherAttendance);
      can(Actions.create, LeaveRequest);
    }
    if (hasPermission(perms, Actions.update, ResourceEnum.ATTENDANCE)) {
      can(Actions.update, StudentAttendance);
      can(Actions.update, TeacherAttendance);
      can(Actions.update, LeaveRequest);
    }
    if (hasPermission(perms, Actions.delete, ResourceEnum.ATTENDANCE)) {
      can(Actions.delete, StudentAttendance);
      can(Actions.delete, TeacherAttendance);
      can(Actions.delete, LeaveRequest);
    }
  },

  PORTAL_USER({ user, can }) {
    can(Actions.read, StudentAttendance);
    can(Actions.read, LeaveRequest, { userId: user?.id });
    can(Actions.create, LeaveRequest);
    can(Actions.update, LeaveRequest, { userId: user?.id });
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};

