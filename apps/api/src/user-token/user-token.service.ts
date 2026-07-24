import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import {
  TokenStatusEnum,
  TokenTypeEnum,
  type CreateUserTokenDto,
} from '@repo/shared';
import { Op } from 'sequelize';
import type { JwtPayload } from '../auth/dto/jwt-payload.dto.js';
import type { User } from '../user/model/user.model.js';
import { UserToken } from './model/user-token.model.js';

@Injectable()
export class UserTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UserToken)
    private readonly userTokenRepo: typeof UserToken,
  ) {}

  create(dto: CreateUserTokenDto) {
    return this.userTokenRepo.create(dto);
  }

  findOne(token: string) {
    return this.userTokenRepo.findOne({
      where: {
        token,
        status: TokenStatusEnum.ACTIVE,
        expDate: { [Op.gt]: new Date() },
      },
    });
  }

  async revoke({ token, userId }: { token?: string; userId?: number }) {
    if (!token && !userId) return;
    await this.userTokenRepo.update(
      {
        status: TokenStatusEnum.REVOKED,
      },
      {
        where: {
          [Op.or]: [{ token: token ?? '' }, { userId: userId ?? 0 }],
          status: TokenStatusEnum.ACTIVE,
        },
      },
    );
  }

  async generateAccessToken(user: User) {
    const payload: JwtPayload = {
      username: user.username,
      sub: user.id,
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
