import type { RoleAttribute } from '@repo/contracts';
import { Role } from '../entity/role.entity.js';
import { PermissionMapper } from '@src/permission/mapper/permission.mapper.js';

export class RoleMapper {
  static toDto(entity: Role): RoleAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      permissions: entity.permissions
        ? PermissionMapper.toDtoList(entity.permissions)
        : undefined,
    };
  }

  static toDtoList(entities: Role[]): RoleAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
