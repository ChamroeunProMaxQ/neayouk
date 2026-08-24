import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TokenStatusEnum,
  TokenTypeEnum,
  type CreateUserTokenDto,
  type PermissionDto,
} from '@repo/contracts';
import type { FindOptionsWhere } from 'typeorm';
import { MoreThan, Repository } from 'typeorm';
import type { JwtPayload } from '@src/auth/dto/jwt-payload.dto.js';
import type { User } from '@src/user/entity/user.entity.js';
import { UserToken } from './entity/user-token.entity.js';

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
      relations: ['user', 'user.roles', 'user.roles.permissions'],
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
    const roles: string[] =
      user.roles && user.roles.length > 0
        ? user.roles.map((r) => (typeof r === 'string' ? r : r.slug))
        : [user.userType?.toLowerCase() ?? 'customer'];

    const permMap = new Map<string, PermissionDto>();
    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const perm of role.permissions) {
            const key = `${perm.resource}:${perm.action}`;
            if (!permMap.has(key)) {
              permMap.set(key, {
                id: perm.id,
                resource: perm.resource,
                action: perm.action,
                description: perm.description ?? undefined,
              });
            }
          }
        }
      }
    }

    const permissions = Array.from(permMap.values());

    const payload: JwtPayload = {
      username: user.username,
      sub: user.id,
      type: user.userType,
      userType: user.userType,
      roles,
      permissions,
    };

    const token = this.jwtService.sign(payload);
    await this.create({
      expDate: new Date(Date.now() + 15 * 60 * 1000),
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
