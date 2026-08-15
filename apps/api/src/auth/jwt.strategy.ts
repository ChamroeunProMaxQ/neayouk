import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './dto/jwt-payload.dto.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected readonly configSerive: ConfigService) {
    super({
      // Extracts the token from the 'Authorization: Bearer <TOKEN>' header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configSerive.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Runs automatically after the token is verified.
  // The object returned here is injected into the Request object as 'req.user'
  async validate(payload: JwtPayload) {
    // const isExpired = payload.exp * 1000 < Date.now();
    // if (isExpired) throw new UnauthorizedException('Token is expired');
    return { sub: payload.sub, username: payload.username, type: payload.type, id: payload.sub };
  }
}
