import type { FeeStructureAttribute } from '@repo/contracts';
import type { FeeStructure } from '../entity/fee-structure.entity.js';

export class FeeStructureMapper {
  static toDto(entity: FeeStructure): FeeStructureAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      category: entity.category,
      amount: Number(entity.amount ?? 0),
      billingCycle: entity.billingCycle,
      isOptional: entity.isOptional ?? false,
      programId: entity.programId ?? null,
      academicYear: entity.academicYear ?? null,
      description: entity.description ?? null,
      isActive: entity.isActive ?? true,
      createdAt: entity.createdAt ? new Date(entity.createdAt).toISOString() : undefined,
      updatedAt: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : undefined,
    };
  }

  static toDtoList(entities: FeeStructure[]): FeeStructureAttribute[] {
    return entities.map((e) => this.toDto(e));
  }
}
