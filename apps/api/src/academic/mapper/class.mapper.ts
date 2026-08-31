import {
  ClassEnrollmentStatusEnum,
  type ClassAttribute,
  type ClassTimetableAttribute,
} from '@repo/contracts';
import { Class } from '../entity/class.entity.js';
import { ClassTimetable } from '../entity/class-timetable.entity.js';

export class ClassMapper {
  static toDto(entity: Class): ClassAttribute {
    const activeEnrollments = entity.enrollments
      ? entity.enrollments.filter(
          (e) =>
            e.status === ClassEnrollmentStatusEnum.ENROLLED ||
            (e.status as string) === 'ENROLLED',
        )
      : [];

    const programName =
      typeof entity.program === 'object' && entity.program
        ? entity.program.name
        : entity.program || null;

    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      code: entity.code,
      gradeLevel: entity.gradeLevel,
      programId: entity.programId ? Number(entity.programId) : null,
      programName,
      program: programName,
      section: entity.section,
      room: entity.room,
      shift: entity.shift,
      startTime: entity.startTime,
      endTime: entity.endTime,
      startDate: entity.startDate,
      endDate: entity.endDate,
      monthlyFee: Number(entity.monthlyFee || 0),
      teacherId: entity.teacherId ? Number(entity.teacherId) : null,
      teacherName: entity.teacher ? entity.teacher.name : null,
      teacher: entity.teacher
        ? {
            id: entity.teacher.id,
            name: entity.teacher.name,
            teacherCode: entity.teacher.teacherCode ?? null,
          }
        : null,
      academicYear: entity.academicYear,
      semester: entity.semester,
      status: entity.status,
      branchId: entity.branchId,
      studentCount:
        entity.enrollments !== undefined ? activeEnrollments.length : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: Class[]): ClassAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

export class ClassTimetableMapper {
  static toDto(entity: ClassTimetable): ClassTimetableAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      classId: entity.classId,
      dayOfWeek: entity.dayOfWeek,
      subject: entity.subject,
      subjectCode: entity.subjectCode,
      teacherId: entity.teacherId ? Number(entity.teacherId) : null,
      teacherName: entity.teacherName,
      room: entity.room,
      startTime: entity.startTime,
      endTime: entity.endTime,
      colorTag: entity.colorTag,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDtoList(entities: ClassTimetable[]): ClassTimetableAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
