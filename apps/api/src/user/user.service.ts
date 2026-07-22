import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './create-user.dto.js';
import { User } from './user.model.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userRepo: typeof User,
  ) {}

  findAll() {
    return this.userRepo.findAll();
  }

  findOne(userId: number) {
    return this.userRepo.findByPk(userId);
  }

  async createUser(dto: CreateUserDto, userId: number) {
    return await this.userRepo.create({
      password: dto.password,
      username: dto.name,
    });
  }
}
