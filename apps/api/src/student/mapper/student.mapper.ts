import {
  ClassEnrollmentStatusEnum,
  type StudentAttribute,
  type StudentClassEnrollmentAttribute,
} from '@repo/contracts';
import { Student } from '../entity/student.entity.js';
import { StudentClass } from '../entity/student-class.entity.js';
import { ClassMapper } from '@src/academic/mapper/class.mapper.js';

export class StudentClassMapper {
  static toDto(entity: StudentClass): StudentClassEnrollmentAttribute {
    return {
      id: entity.id,
      studentId: entity.studentId,
      classId: entity.classId,
      student: entity.student ? StudentMapper.toDto(entity.student) : undefined,
      class: entity.class ? ClassMapper.toDto(entity.class) : undefined,
      academicYear: entity.academicYear,
      semester: entity.semester,
      isPrimary: Boolean(entity.isPrimary),
      status: entity.status,
      enrolledAt: entity.enrolledAt,
      completedAt: entity.completedAt,
      remarks: entity.remarks,
    };
  }

  static toDtoList(entities: StudentClass[]): StudentClassEnrollmentAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

export class StudentMapper {
  static toDto(entity: Student): StudentAttribute {
    const activeEnrollments = entity.enrollments
      ? entity.enrollments.filter((e) => e.status === ClassEnrollmentStatusEnum.ENROLLED)
      : [];
    const primaryEnrollment = activeEnrollments.find((e) => e.isPrimary) || activeEnrollments[0];
    const classesList = entity.enrollments
      ? entity.enrollments
          .map((e) => (e.class ? ClassMapper.toDto(e.class) : undefined))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
      : undefined;

    return {
      id: entity.id,
      uuid: entity.uuid,
      studentCode: entity.studentCode,
      firstName: entity.firstName,
      lastName: entity.lastName,
      firstNameKm: entity.firstNameKm,
      lastNameKm: entity.lastNameKm,
      gender: entity.gender,
      dateOfBirth: entity.dateOfBirth,
      contact: entity.contact,
      guardianName: entity.guardianName,
      guardianPhone: entity.guardianPhone,
      payableDate: entity.payableDate,
      registeredAt: entity.registeredAt,
      discount: Number(entity.discount || 0),
      status: entity.status,
      enrollments: entity.enrollments ? StudentClassMapper.toDtoList(entity.enrollments) : undefined,
      classes: classesList,
      primaryClass: primaryEnrollment?.class ? ClassMapper.toDto(primaryEnrollment.class) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: Student[]): StudentAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
