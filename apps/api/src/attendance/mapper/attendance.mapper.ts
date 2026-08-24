import type {
  StudentAttendanceAttribute,
  TeacherAttendanceAttribute,
  LeaveRequestAttribute,
} from '@repo/contracts';
import type { StudentAttendance } from '../entity/student-attendance.entity.js';
import type { TeacherAttendance } from '../entity/teacher-attendance.entity.js';
import type { LeaveRequest } from '../entity/leave-request.entity.js';

export class AttendanceMapper {
  static toStudentAttendanceDto(
    entity: StudentAttendance,
  ): StudentAttendanceAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      studentId: entity.studentId,
      studentName: entity.student
        ? `${entity.student.firstName} ${entity.student.lastName}`
        : undefined,
      studentCode: entity.student?.studentCode ?? null,
      studentGender: entity.student?.gender,
      classId: entity.classId,
      className: entity.class?.name,
      date:
        typeof entity.date === 'string'
          ? entity.date
          : ((entity.date as any)?.toISOString?.()?.slice(0, 10) ??
            String(entity.date)),
      status: entity.status,
      sessionSlotId: entity.sessionSlotId ?? null,
      remarks: entity.remarks ?? null,
      recordedBy: entity.recordedBy ?? null,
      recorderName: entity.recorder?.username ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toStudentAttendanceDtoList(
    entities: StudentAttendance[],
  ): StudentAttendanceAttribute[] {
    return entities.map((e) => this.toStudentAttendanceDto(e));
  }

  static toTeacherAttendanceDto(
    entity: TeacherAttendance,
  ): TeacherAttendanceAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      teacherId: entity.teacherId,
      teacherName: entity.teacher?.name,
      teacherCode: entity.teacher?.teacherCode ?? null,
      date:
        typeof entity.date === 'string'
          ? entity.date
          : ((entity.date as any)?.toISOString?.()?.slice(0, 10) ??
            String(entity.date)),
      checkInTime: entity.checkInTime ?? null,
      checkOutTime: entity.checkOutTime ?? null,
      hoursWorked: Number(entity.hoursWorked || 0),
      status: entity.status,
      remarks: entity.remarks ?? null,
      verifiedBy: entity.verifiedBy ?? null,
      verifierName: entity.verifier?.username ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toTeacherAttendanceDtoList(
    entities: TeacherAttendance[],
  ): TeacherAttendanceAttribute[] {
    return entities.map((e) => this.toTeacherAttendanceDto(e));
  }

  static toLeaveRequestDto(entity: LeaveRequest): LeaveRequestAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      teacherId: entity.teacherId,
      teacherName: entity.teacher?.name,
      teacherCode: entity.teacher?.teacherCode ?? null,
      userId: entity.userId ?? null,
      leaveType: entity.leaveType,
      startDate:
        typeof entity.startDate === 'string'
          ? entity.startDate
          : ((entity.startDate as any)?.toISOString?.()?.slice(0, 10) ??
            String(entity.startDate)),
      endDate:
        typeof entity.endDate === 'string'
          ? entity.endDate
          : ((entity.endDate as any)?.toISOString?.()?.slice(0, 10) ??
            String(entity.endDate)),
      totalDays: Number(entity.totalDays || 1),
      reason: entity.reason,
      attachmentUrl: entity.attachmentUrl ?? null,
      status: entity.status,
      reviewerId: entity.reviewerId ?? null,
      reviewerName: entity.reviewer?.username ?? undefined,
      reviewedAt: entity.reviewedAt ?? null,
      rejectionReason: entity.rejectionReason ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toLeaveRequestDtoList(
    entities: LeaveRequest[],
  ): LeaveRequestAttribute[] {
    return entities.map((e) => this.toLeaveRequestDto(e));
  }
}
