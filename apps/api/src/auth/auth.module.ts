import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserToken } from '@src/user-token/entity/user-token.entity.js';
import { UserTokenService } from '@src/user-token/user-token.service.js';
import { User } from '@src/user/entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Permission } from '@src/permission/entity/permission.entity.js';
import { UserService } from '@src/user/user.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.getOrThrow<string>('JWT_EXPIRES_IN')),
        },
      }),
    }),
    TypeOrmModule.forFeature([User, UserToken, Role, Permission]),
  ],
  providers: [AuthService, JwtStrategy, UserService, UserTokenService],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
