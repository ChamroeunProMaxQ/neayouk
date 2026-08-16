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

  async findAll({
    search,
    userType,
    role,
    includeDeleted,
    onlyDeleted,
    sortBy,
    sortOrder,
    ...dto
  }: FindUsersDto) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (onlyDeleted) {
      query.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    if (userType) {
      query.andWhere('user.userType = :userType', { userType });
    }

    if (role) {
      query.andWhere('roles.slug = :role', { role });
    }

    const searchVal = search || (dto as any).name;
    if (searchVal) {
      query.andWhere('user.username like :search', { search: `%${searchVal}%` });
    }
    query.orderBy(`user.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    return await query.getManyAndCount();
  }

  async findOne(userId: number) {
    return await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  private async resolveUserRoles(dtoRoles?: string[], dtoRoleIds?: number[]): Promise<Role[]> {
    if (dtoRoles && dtoRoles.length > 0) {
      return await this.roleRepo.findBy({ slug: In(dtoRoles) });
    }

    if (dtoRoleIds && dtoRoleIds.length > 0) {
      return await this.roleRepo.findBy({ id: In(dtoRoleIds) });
    }

    return [];
  }

  async createUser(dto: CreateUserDto, _userId?: number) {
    const roles = await this.resolveUserRoles(dto.roles, dto.roleIds);

    const user = this.userRepo.create({
      password: dto.password,
      username: dto.username,
      userType: dto.userType,
      status: dto.status,
      roles,
    });
    return await this.userRepo.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto, _userId?: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (dto.username) user.username = dto.username;
    if (dto.password) user.password = dto.password;
    if (dto.userType) user.userType = dto.userType;
    if (dto.status) user.status = dto.status;

    if (dto.roles !== undefined || dto.roleIds !== undefined) {
      user.roles = await this.resolveUserRoles(dto.roles, dto.roleIds);
    }

    await this.userRepo.save(user);
    return await this.findOne(id);
  }

  async deleteUser(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.userRepo.softDelete(id);
    return { id, success: true };
  }
}
