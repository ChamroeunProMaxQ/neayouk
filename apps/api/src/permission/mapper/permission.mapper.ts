import type { PermissionAttribute } from '@repo/contracts';
import { Permission } from '../entity/permission.entity.js';

export class PermissionMapper {
  static toDto(entity: Permission): PermissionAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      resource: entity.resource,
      action: entity.action,
      description: entity.description,
    };
  }

  static toDtoList(entities: Permission[]): PermissionAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
