import { Injectable, UnauthorizedException } from '@nestjs/common';
import { comparePassword } from '../common/helper/password.helper.js';
import { UserTokenService } from '../user-token/user-token.service.js';
import { UserService } from '../user/user.service.js';
import type { LogInDto } from './dto/log-in.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServer: UserService,
    private readonly userTokenSerive: UserTokenService,
  ) {}

  // Mock login method (replace with database lookup and bcrypt check in real apps)
  async login(dto: LogInDto) {
    const user = await this.userServer.findByUsername(dto.username);
    const isMatch = comparePassword(
      dto.password,
      user.getDataValue('password'),
    );
    if (!isMatch) throw new UnauthorizedException();

    const accessToken = await this.userTokenSerive.generateAccessToken(user);
    const refreshToken = await this.userTokenSerive.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: number) {
    return this.userTokenSerive.revoke({ userId });
  }

  async refreshToken(tokenStr: string, userId: number) {
    const token = await this.userTokenSerive.findOne(tokenStr);
    if (!token) throw new UnauthorizedException();
    const user = await token.getUser();
    if (user.id != userId) throw new UnauthorizedException();
    const accessToken = await this.userTokenSerive.generateAccessToken(user);
    const refreshToken = await this.userTokenSerive.generateRefreshToken(user);
    // revoke token
    await this.userTokenSerive.revoke({ token: token.token });

    return {
      accessToken,
      refreshToken,
    };
  }
}
