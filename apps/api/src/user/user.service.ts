import type { LoggerService } from '@nestjs/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { UserMapper } from './mapper/user.mapper.js';

import { UserTypeEnum } from '@repo/contracts';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async findAll(
    {
      search,
      userType,
      role,
      branchId,
      includeDeleted,
      onlyDeleted,
      sortBy = 'id',
      sortOrder = 'DESC',
      ...dto
    }: FindUsersDto,
    currentUser?: { userType?: UserTypeEnum; branchId?: number | null },
  ) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.branch', 'branch');

    if (onlyDeleted) {
      query.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    // Branch scoping: If not SUPER_ADMIN, strictly constrain to currentUser's branchId
    if (currentUser && currentUser.userType !== UserTypeEnum.SUPER_ADMIN && currentUser.branchId) {
      query.andWhere('user.branch_id = :currentBranchId', {
        currentBranchId: currentUser.branchId,
      });
    } else if (branchId) {
      query.andWhere('user.branch_id = :branchId', { branchId });
    }

    if (userType) {
      query.andWhere('user.userType = :userType', { userType });
    }

    if (role) {
      query.andWhere('roles.slug = :role', { role });
    }

    const searchVal = search || (dto as any).name;
    if (searchVal) {
      query.andWhere('user.username like :search', {
        search: `%${searchVal}%`,
      });
    }
    query.orderBy(`user.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [UserMapper.toDtoList(entities), total];
  }

  async findOne(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'branch'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return UserMapper.toDto(user);
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions', 'branch'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  private async resolveUserRoles(
    dtoRoles?: string[],
    dtoRoleIds?: number[],
  ): Promise<Role[]> {
    if (dtoRoles && dtoRoles.length > 0) {
      return await this.roleRepo.findBy({ slug: In(dtoRoles) });
    }

    if (dtoRoleIds && dtoRoleIds.length > 0) {
      return await this.roleRepo.findBy({ id: In(dtoRoleIds) });
    }

    return [];
  }

  async createUser(
    dto: CreateUserDto,
    currentUser?: { sub?: number; userType?: UserTypeEnum; branchId?: number | null } | number,
  ) {
    const roles = await this.resolveUserRoles(dto.roles, dto.roleIds);

    const authContext = typeof currentUser === 'object' ? currentUser : undefined;
    const targetBranchId =
      authContext && authContext.userType !== UserTypeEnum.SUPER_ADMIN && authContext.branchId
        ? authContext.branchId
        : (dto.branchId ?? null);

    const user = this.userRepo.create({
      password: dto.password,
      username: dto.username,
      userType: dto.userType,
      status: dto.status,
      branchId: targetBranchId,
      roles,
    });
    const saved = await this.userRepo.save(user);
    const reloaded = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['roles', 'roles.permissions', 'branch'],
    });
    return UserMapper.toDto(reloaded || saved);
  }

  async updateUser(
    id: number,
    dto: UpdateUserDto,
    _userId?: number,
    currentUser?: { sub?: number; userType?: UserTypeEnum; branchId?: number | null },
  ) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'branch'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (dto.username) user.username = dto.username;
    if (dto.password) user.password = dto.password;
    if (dto.userType) user.userType = dto.userType;
    if (dto.status) user.status = dto.status;
    if (dto.branchId !== undefined) {
      const isSuperAdmin = currentUser && currentUser.userType === UserTypeEnum.SUPER_ADMIN;
      if (!currentUser || isSuperAdmin) {
        user.branchId = dto.branchId;
        (user as any).branch = undefined;
      }
    }

    if (dto.roles !== undefined || dto.roleIds !== undefined) {
      user.roles = await this.resolveUserRoles(dto.roles, dto.roleIds);
    }

    const saved = await this.userRepo.save(user);
    const reloaded = await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['roles', 'roles.permissions', 'branch'],
    });
    return UserMapper.toDto(reloaded || saved);
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.userRepo.softDelete(id);
    return { id, success: true };
  }
}
