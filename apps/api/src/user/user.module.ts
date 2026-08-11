import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from './model/user.model.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { CaslModule } from 'nest-casl';
import { permissions } from './user.permission.js';
import { UserHook } from './user.hook.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CaslModule.forFeature({ permissions }), AuthModule],
  controllers: [UserController],
  providers: [UserService, UserHook],
})
export class UserModule { }
