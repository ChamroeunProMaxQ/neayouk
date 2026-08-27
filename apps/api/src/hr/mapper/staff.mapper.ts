import type {
  StaffAttribute,
  StaffDepartmentEnum,
  StaffEmploymentTypeEnum,
  StaffGenderEnum,
  StaffSalaryTypeEnum,
  StaffStatusEnum,
} from '@repo/contracts';
import { Staff } from '../entity/staff.entity.js';
import { UserMapper } from '@src/user/mapper/user.mapper.js';

export class StaffMapper {
  static toDto(entity: Staff): StaffAttribute {
    const classesList = entity.classes
      ? entity.classes.map((cls) => ({
          id: cls.id,
          uuid: cls.uuid,
          name: cls.name,
          code: cls.code ?? undefined,
          gradeLevel: cls.gradeLevel ?? undefined,
          section: cls.section ?? undefined,
          shift: cls.shift ?? undefined,
          room: cls.room ?? undefined,
          studentCount: cls.enrollments
            ? cls.enrollments.filter((e) => e.status === 'ENROLLED').length
            : undefined,
        }))
      : undefined;

    return {
      id: entity.id,
      uuid: entity.uuid,
      userId: entity.userId ? Number(entity.userId) : null,
      staffCode: entity.staffCode ?? null,
      name: entity.name,
      nameKm: entity.nameKm ?? null,
      gender: (entity.gender as StaffGenderEnum) || 'MALE',
      dateOfBirth: entity.dateOfBirth ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      department: (entity.department as StaffDepartmentEnum) || 'ACADEMIC',
      designation: entity.designation || 'Teacher',
      specialization: entity.specialization ?? null,
      bio: entity.bio ?? null,
      employmentType:
        (entity.employmentType as StaffEmploymentTypeEnum) || 'FULL_TIME',
      salaryType: (entity.salaryType as StaffSalaryTypeEnum) || 'MONTHLY',
      baseSalary: Number(entity.baseSalary || 0),
      hourlyRate: Number(entity.hourlyRate || 0),
      joiningDate: entity.joiningDate ? String(entity.joiningDate) : null,
      bankName: entity.bankName ?? null,
      bankAccountName: entity.bankAccountName ?? null,
      bankAccountNumber: entity.bankAccountNumber ?? null,
      status: (entity.status as StaffStatusEnum) || 'ACTIVE',
      notes: entity.notes ?? null,
      classCount:
        entity.classes !== undefined ? entity.classes.length : undefined,
      classes: classesList,
      user: entity.user ? UserMapper.toDto(entity.user) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: Staff[]): StaffAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
