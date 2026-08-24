import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './dto/jwt-payload.dto.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    super({
      // Extracts the token from the 'Authorization: Bearer <TOKEN>' header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Runs automatically after the token is verified.
  // The object returned here is injected into the Request object as 'req.user'
  async validate(payload: JwtPayload) {
    const userType = payload.userType ?? payload.type;
    const roles =
      payload.roles && payload.roles.length > 0
        ? payload.roles
        : userType
          ? [userType.toLowerCase()]
          : [];
    const permissions = payload.permissions ?? [];

    return {
      sub: payload.sub,
      id: payload.sub,
      username: payload.username,
      type: userType,
      userType,
      roles,
      permissions,
    };
  }
}
