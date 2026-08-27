import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { StudentAttendance } from './entity/student-attendance.entity.js';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { LeaveRequest } from './entity/leave-request.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

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
    registerCaslPermissions(can, perms, StudentAttendance, ResourceEnum.STUDENT_ATTENDANCE);
    registerCaslPermissions(can, perms, TeacherAttendance, ResourceEnum.TEACHER_ATTENDANCE);
    registerCaslPermissions(can, perms, LeaveRequest, ResourceEnum.LEAVE_REQUEST);
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

