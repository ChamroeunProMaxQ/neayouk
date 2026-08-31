import type { BranchDto } from '@repo/contracts';
import { Branch } from '../entity/branch.entity.js';

export class BranchMapper {
  static toDto(entity: Branch): BranchDto {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      code: entity.code,
      address: entity.address ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      isDefault: entity.isDefault,
      status: entity.status,
      adminUserId: entity.adminUserId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }

  static toDtoList(entities: Branch[]): BranchDto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
