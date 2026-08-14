import type { LoggerService } from '@nestjs/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entity/user.entity.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {
    //
  }

  async findAll({
    search,
    userType,
    includeDeleted,
    onlyDeleted,
    sortBy,
    sortOrder,
    ...dto
  }: FindUsersDto) {
    const query = this.userRepo
      .createQueryBuilder('user');

    if (onlyDeleted) {
      query.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    if (userType) {
      query.andWhere('user.userType = :userType', { userType });
    }

    if (search) {
      query.andWhere('user.username like :search', { search: `%${search}%` });
    }
    query.orderBy(sortBy, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);


    return await query.getManyAndCount();
  }

  async findOne(userId: number) {
    return await this.userRepo.findOneBy({ id: userId });
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findOneBy({ username });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async createUser(dto: CreateUserDto, userId?: number) {
    const user = this.userRepo.create({
      password: dto.password,
      username: dto.username,
      userType: dto.userType,
      status: dto.status,
    });
    return await this.userRepo.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto, userId: number) {
    await this.userRepo.update({ id }, dto);
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
