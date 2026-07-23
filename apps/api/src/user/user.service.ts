import type { LoggerService } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { APP_LOGGER } from '../common/config/logger.config.js';
import { CreateUserDto } from './create-user.dto.js';
import { User } from './user.model.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userRepo: typeof User,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  findAll() {
    this.logger.log(`this is log from winston lok`);
    return this.userRepo.findAll();
  }

  async findOne(userId: number) {
    //const span = this.traceService.getTracer().startSpan('find-user');
    const user = await this.userRepo.findByPk(userId);
    this.logger.log({
      user,
    });
    //span.end();
    return user;
  }

  async createUser(dto: CreateUserDto, userId: number) {
    return await this.userRepo.create({
      password: dto.password,
      username: dto.name,
    });
  }
}
