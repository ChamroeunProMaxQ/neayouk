import type { ProgramAttribute } from '@repo/contracts';
import { Program } from '../entity/program.entity.js';

export class ProgramMapper {
  static toDto(entity: Program): ProgramAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      code: entity.code,
      books: Array.isArray(entity.books) ? entity.books : [],
      gradeLevels: Array.isArray(entity.gradeLevels) ? entity.gradeLevels : [],
      status: entity.status,
      classCount:
        entity.classes !== undefined ? entity.classes.length : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: Program[]): ProgramAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
