import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entity/permission.entity.js';
import { PermissionMapper } from './mapper/permission.mapper.js';
import type { FindPermissionsDto } from './dto/find-permissions.dto.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async findAll(dto?: FindPermissionsDto) {
    const query = this.permissionRepo.createQueryBuilder('permission');

    if (dto?.search) {
      query.andWhere(
        '(permission.resource LIKE :search OR permission.action LIKE :search OR permission.description LIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    if (dto?.resource) {
      query.andWhere('permission.resource = :resource', {
        resource: dto.resource,
      });
    }

    if (dto?.sortBy) {
      query.orderBy(`permission.${dto.sortBy}`, dto.sortOrder ?? 'ASC');
    } else {
      query
        .orderBy('permission.resource', 'ASC')
        .addOrderBy('permission.action', 'ASC');
    }

    if (dto?.page && dto?.pageSize) {
      const { skip, take } = getSkipTake(dto);
      query.skip(skip).take(take);
      const [entities, total] = await query.getManyAndCount();
      return [PermissionMapper.toDtoList(entities), total];
    }

    const rows = await query.getMany();
    return [PermissionMapper.toDtoList(rows), rows.length];
  }
}
