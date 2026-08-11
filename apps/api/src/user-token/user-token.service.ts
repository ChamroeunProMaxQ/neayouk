import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TokenStatusEnum,
  TokenTypeEnum,
  type CreateUserTokenDto,
} from '@repo/shared';
import type { FindOptionsWhere } from 'typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { JwtPayload } from '../auth/dto/jwt-payload.dto.js';
import type { User } from '../user/model/user.model.js';
import { UserToken } from './model/user-token.model.js';

@Injectable()
export class UserTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserToken)
    private readonly userTokenRepo: Repository<UserToken>,
  ) {}

  async create(dto: CreateUserTokenDto) {
    const userToken = this.userTokenRepo.create(dto);
    return await this.userTokenRepo.save(userToken);
  }

  findOne(token: string) {
    return this.userTokenRepo.findOne({
      where: {
        token,
        status: TokenStatusEnum.ACTIVE,
        expDate: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async revoke({ token, userId }: { token?: string; userId?: number }) {
    if (!token && !userId) return;
    const conditions: FindOptionsWhere<UserToken>[] = [];
    if (token) {
      conditions.push({ token, status: TokenStatusEnum.ACTIVE });
    }
    if (userId) {
      conditions.push({ userId, status: TokenStatusEnum.ACTIVE });
    }
    await this.userTokenRepo.update(conditions, {
      status: TokenStatusEnum.REVOKED,
    });
  }

  async generateAccessToken(user: User) {
    const payload: JwtPayload = {
      username: user.username,
      sub: user.id,
      type: user.userType,
    };
    const token = this.jwtService.sign(payload);
    await this.create({
      expDate: new Date(Date.now() + 1 * 60 * 1000),
      userId: user.id,
      token: token,
      tokenType: TokenTypeEnum.ACCESS_TOKEN,
      status: TokenStatusEnum.ACTIVE,
    });
    return token;
  }

  async generateRefreshToken(user: User) {
    const token = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });
    await this.create({
      expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: user.id,
      token: token,
      tokenType: TokenTypeEnum.REFRESH_TOKEN,
      status: TokenStatusEnum.ACTIVE,
    });
    return token;
  }
}
