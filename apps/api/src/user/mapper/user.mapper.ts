import type { UserAttribute } from '@repo/contracts';
import { User } from '../entity/user.entity.js';
import { RoleMapper } from '@src/role/mapper/role.mapper.js';

export class UserMapper {
  static toDto(entity: User): UserAttribute {
    const rolesList =
      entity.roles && entity.roles.length > 0
        ? entity.roles.map((r) =>
            typeof r === 'string' ? r : RoleMapper.toDto(r),
          )
        : [entity.userType?.toLowerCase() ?? 'customer'];

    return {
      id: entity.id,
      uuid: entity.uuid,
      username: entity.username,
      password: '',
      userType: entity.userType,
      status: entity.status,
      roles: rolesList,
      roleIds: entity.roles
        ?.map((r) => (typeof r === 'string' ? 0 : r.id))
        .filter(Boolean),
      computedNameId: `user-${entity.id}`,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toDtoList(entities: User[]): UserAttribute[] {
    return entities.map((e) => this.toDto(e));
  }
}
