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

    // Student Attendance
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.STUDENT_ATTENDANCE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ATTENDANCE)
    ) {
      can(Actions.manage, StudentAttendance);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.STUDENT_ATTENDANCE) ||
        hasPermission(perms, Actions.read, ResourceEnum.ATTENDANCE)
      ) {
        can(Actions.read, StudentAttendance);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.STUDENT_ATTENDANCE) ||
        hasPermission(perms, Actions.create, ResourceEnum.ATTENDANCE)
      ) {
        can(Actions.create, StudentAttendance);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.STUDENT_ATTENDANCE) ||
        hasPermission(perms, Actions.update, ResourceEnum.ATTENDANCE)
      ) {
        can(Actions.update, StudentAttendance);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.STUDENT_ATTENDANCE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ATTENDANCE)
      ) {
        can(Actions.delete, StudentAttendance);
      }
    }

    // Teacher Attendance
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.TEACHER_ATTENDANCE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ATTENDANCE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.TEACHER) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC) ||
      hasPermission(perms, Actions.manage, ResourceEnum.HR)
    ) {
      can(Actions.manage, TeacherAttendance);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.TEACHER_ATTENDANCE) ||
        hasPermission(perms, Actions.read, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.read, ResourceEnum.TEACHER) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC) ||
        hasPermission(perms, Actions.read, ResourceEnum.HR)
      ) {
        can(Actions.read, TeacherAttendance);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.TEACHER_ATTENDANCE) ||
        hasPermission(perms, Actions.create, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.create, ResourceEnum.TEACHER) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC) ||
        hasPermission(perms, Actions.create, ResourceEnum.HR)
      ) {
        can(Actions.create, TeacherAttendance);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.TEACHER_ATTENDANCE) ||
        hasPermission(perms, Actions.update, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.update, ResourceEnum.TEACHER) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC) ||
        hasPermission(perms, Actions.update, ResourceEnum.HR)
      ) {
        can(Actions.update, TeacherAttendance);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.TEACHER_ATTENDANCE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.TEACHER) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC) ||
        hasPermission(perms, Actions.delete, ResourceEnum.HR)
      ) {
        can(Actions.delete, TeacherAttendance);
      }
    }

    // Leave Requests
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.LEAVE_REQUEST) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ATTENDANCE) ||
      hasPermission(perms, Actions.manage, ResourceEnum.HR)
    ) {
      can(Actions.manage, LeaveRequest);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.LEAVE_REQUEST) ||
        hasPermission(perms, Actions.read, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.read, ResourceEnum.HR)
      ) {
        can(Actions.read, LeaveRequest);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.LEAVE_REQUEST) ||
        hasPermission(perms, Actions.create, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.create, ResourceEnum.HR)
      ) {
        can(Actions.create, LeaveRequest);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.LEAVE_REQUEST) ||
        hasPermission(perms, Actions.update, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.update, ResourceEnum.HR)
      ) {
        can(Actions.update, LeaveRequest);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.LEAVE_REQUEST) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ATTENDANCE) ||
        hasPermission(perms, Actions.delete, ResourceEnum.HR)
      ) {
        can(Actions.delete, LeaveRequest);
      }
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
