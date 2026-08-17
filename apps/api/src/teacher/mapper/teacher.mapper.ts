import type { TeacherAttribute, TeacherGenderEnum } from '@repo/contracts';
import { Teacher } from '../entity/teacher.entity.js';
import { UserMapper } from '@src/user/mapper/user.mapper.js';

export class TeacherMapper {
  static toDto(entity: Teacher): TeacherAttribute {
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
      teacherCode: entity.teacherCode ?? null,
      name: entity.name,
      nameKm: entity.nameKm ?? null,
      gender: (entity.gender as TeacherGenderEnum) || 'MALE',
      dateOfBirth: entity.dateOfBirth ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      salaryInHour: Number(entity.salaryInHour || 0),
      specialization: entity.specialization ?? null,
      bio: entity.bio ?? null,
      status: entity.status,
      classCount: entity.classes !== undefined ? entity.classes.length : undefined,
      classes: classesList,
      user: entity.user ? UserMapper.toDto(entity.user) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: Teacher[]): TeacherAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
