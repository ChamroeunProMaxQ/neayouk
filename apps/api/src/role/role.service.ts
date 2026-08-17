import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entity/role.entity.js';
import { Permission } from '@src/permission/entity/permission.entity.js';
import { RoleMapper } from './mapper/role.mapper.js';
import type { FindRolesDto } from './dto/find-roles.dto.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';
import type { RolePermissionInputDto } from '@repo/contracts';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) { }

  async findAll(dto: FindRolesDto) {
    const query = this.roleRepo
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    if (dto.search) {
      query.andWhere(
        '(role.name LIKE :search OR role.slug LIKE :search OR role.description LIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    const sortBy = dto.sortBy ? `role.${dto.sortBy}` : 'role.id';
    const sortOrder = dto.sortOrder ?? 'ASC';
    query.orderBy(sortBy, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [RoleMapper.toDtoList(entities), total];
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return RoleMapper.toDto(role);
  }

  async findBySlug(slug: string) {
    if (!slug) return null;

    return await this.roleRepo.findOne({
      where: { slug },
      relations: ['permissions'],
    });
  }

  private async resolvePermissions(
    dtoPermissions?: RolePermissionInputDto[],
  ): Promise<Permission[]> {
    // Guard clause: Return early if no permission objects are supplied
    if (!dtoPermissions || dtoPermissions.length === 0) {
      return [];
    }

    const permissions: Permission[] = [];

    for (const item of dtoPermissions) {
      if (!item.resource || !item.action) continue;

      const existing = await this.permissionRepo.findOneBy({
        resource: item.resource,
        action: item.action,
      });

      if (existing) {
        permissions.push(existing);
        continue;
      }

      const created = this.permissionRepo.create({
        resource: item.resource,
        action: item.action,
        description: item.description,
      });
      const saved = await this.permissionRepo.save(created);
      permissions.push(saved);
    }

    return permissions;
  }

  async create(dto: CreateRoleDto) {
    // Guard clause: Validate slug uniqueness
    const existing = await this.roleRepo.findOneBy({ slug: dto.slug });
    if (existing) {
      throw new ConflictException(`Role with slug "${dto.slug}" already exists`);
    }

    const permissions = await this.resolvePermissions(dto.permissions);

    const role = this.roleRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      permissions,
    });

    const saved = await this.roleRepo.save(role);
    return await this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Guard clause: Validate slug collision if changed
    if (dto.slug && dto.slug !== role.slug) {
      const existing = await this.roleRepo.findOneBy({ slug: dto.slug });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Role with slug "${dto.slug}" already exists`);
      }
      role.slug = dto.slug;
    }

    if (dto.name) {
      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description ?? null;
    }

    if (dto.permissions !== undefined) {
      role.permissions = await this.resolvePermissions(dto.permissions);
    }

    await this.roleRepo.save(role);
    return await this.findOne(id);
  }

  async delete(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.roleRepo.delete(role.id);
    return { id, success: true };
  }
}
