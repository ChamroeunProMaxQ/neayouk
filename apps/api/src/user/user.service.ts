import type { LoggerService } from '@nestjs/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entity/user.entity.js';
import { TokenTypeEnum } from '@repo/contracts';
import { getSkipLimit } from '@src/common/helper/pagination.helper.js';
import { UserScopeBuilder } from './user.scope.js';
import { UserToken } from '@src/user-token/entity/user-token.entity.js';

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

  async findAll({ name, ...dto }: FindUsersDto) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.tokens',
        'token',
        'token.tokenType = :tokenType',
        { tokenType: TokenTypeEnum.REFRESH_TOKEN },
      );

    if (name) {
      query.andWhere('user.username like :name', { name: `%${name}%` });
    }

    const { skip, take } = getSkipLimit(dto);
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
    });
    return await this.userRepo.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto, userId: number) {
    await this.userRepo.update({ id: userId }, dto);
    return await this.findOne(userId);
  }

}
