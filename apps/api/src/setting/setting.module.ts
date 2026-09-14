import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { AuthModule } from '@src/auth/auth.module.js';
import { Branch } from '@src/branch/entity/branch.entity.js';
import { AdminSettingController } from './admin.setting.controller.js';
import { BranchIntegration } from './entity/branch-integration.entity.js';
import { permissions } from './setting.permission.js';
import { SettingService } from './setting.service.js';
import { TelegramService } from './telegram.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, BranchIntegration]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
    NestjsFormDataModule.config({ storage: MemoryStoredFile }),
  ],
  controllers: [AdminSettingController],
  providers: [SettingService, TelegramService],
  exports: [SettingService, TelegramService],
})
export class SettingModule {}
