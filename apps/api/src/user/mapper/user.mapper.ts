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
      branchId: entity.branchId,
      branch: entity.branch
        ? {
            id: entity.branch.id,
            uuid: entity.branch.uuid,
            name: entity.branch.name,
            code: entity.branch.code,
            address: entity.branch.address ?? undefined,
            phone: entity.branch.phone ?? undefined,
            email: entity.branch.email ?? undefined,
            isDefault: entity.branch.isDefault ?? false,
            status: entity.branch.status,
            adminUserId: entity.branch.adminUserId ?? undefined,
            createdAt: entity.branch.createdAt,
            updatedAt: entity.branch.updatedAt,
            deletedAt: entity.branch.deletedAt ?? undefined,
          }
        : entity.branch === null
          ? null
          : undefined,
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
