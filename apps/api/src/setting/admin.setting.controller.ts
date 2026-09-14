import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { FormDataRequest } from 'nestjs-form-data';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import type { AuthContext } from '@src/common/helper/branch-scoping.helper.js';
import { TestTelegramConnectionDto } from './dto/test-telegram-connection.dto.js';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto.js';
import { UpdateTelegramIntegrationDto } from './dto/update-telegram-integration.dto.js';
import { UploadLogoDto } from './dto/upload-logo.dto.js';
import { SettingService } from './setting.service.js';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS, UserTypeEnum.SUPER_ADMIN)
@Controller('admin/settings')
export class AdminSettingController {
  constructor(private readonly settingService: SettingService) {}

  @UseAbility(DefaultActions.read, 'setting')
  @Get('profile')
  getSchoolProfile(@CurrentUser() currentUser: AuthContext) {
    return this.settingService.getSchoolProfile(currentUser);
  }

  @UseAbility(DefaultActions.update, 'setting')
  @Patch('profile')
  updateSchoolProfile(
    @CurrentUser() currentUser: AuthContext,
    @Body() dto: UpdateSchoolProfileDto,
  ) {
    return this.settingService.updateSchoolProfile(currentUser, dto);
  }

  @UseAbility(DefaultActions.update, 'setting')
  @FormDataRequest()
  @Post('logo')
  uploadLogo(
    @CurrentUser() currentUser: AuthContext,
    @Body() dto: UploadLogoDto,
  ) {
    return this.settingService.uploadSchoolLogo(currentUser, dto.logo);
  }

  @UseAbility(DefaultActions.update, 'setting')
  @Delete('logo')
  deleteLogo(@CurrentUser() currentUser: AuthContext) {
    return this.settingService.deleteSchoolLogo(currentUser);
  }

  @UseAbility(DefaultActions.read, 'setting')
  @Get('integrations/telegram')
  getTelegramIntegration(@CurrentUser() currentUser: AuthContext) {
    return this.settingService.getTelegramIntegration(currentUser);
  }

  @UseAbility(DefaultActions.update, 'setting')
  @Put('integrations/telegram')
  updateTelegramIntegration(
    @CurrentUser() currentUser: AuthContext,
    @Body() dto: UpdateTelegramIntegrationDto,
  ) {
    return this.settingService.updateTelegramIntegration(currentUser, dto);
  }

  @UseAbility(DefaultActions.update, 'setting')
  @Post('integrations/telegram/test')
  testTelegramConnection(
    @CurrentUser() currentUser: AuthContext,
    @Body() dto: TestTelegramConnectionDto,
  ) {
    return this.settingService.testTelegramConnection(currentUser, dto);
  }
}
