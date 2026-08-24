import type { GradingRuleAttribute } from '@repo/contracts';
import { GradingRule } from '../entity/grading-rule.entity.js';

export class GradingRuleMapper {
  static toDto(entity: GradingRule): GradingRuleAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      code: entity.code,
      academicYear: entity.academicYear,
      semester: entity.semester,
      components: entity.components ?? [],
      gradeScale: entity.gradeScale ?? [],
      isDefault: Boolean(entity.isDefault),
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: GradingRule[]): GradingRuleAttribute[] {
    return entities.map((e) => this.toDto(e));
  }
}
