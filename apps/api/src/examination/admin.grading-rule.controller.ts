import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { GradingRuleService } from './grading-rule.service.js';
import { GradingRule } from './entity/grading-rule.entity.js';
import {
  CreateGradingRuleDto,
  UpdateGradingRuleDto,
  FindGradingRulesDto,
} from './dto/grading-rule.dto.js';

@ApiTags('Admin Grading Rules')
@ApiBearerAuth()
@Controller('admin/examinations/rules')
export class AdminGradingRuleController {
  constructor(private readonly gradingRuleService: GradingRuleService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, GradingRule)
  @Get()
  async findAll(@Query() query: FindGradingRulesDto) {
    return this.gradingRuleService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, GradingRule)
  @Get('default')
  async findDefault() {
    return this.gradingRuleService.findDefault();
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, GradingRule)
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.gradingRuleService.findById(id);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.create, GradingRule)
  @Post()
  async create(@Body() dto: CreateGradingRuleDto) {
    return this.gradingRuleService.create(dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.update, GradingRule)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradingRuleDto,
  ) {
    return this.gradingRuleService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.delete, GradingRule)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.gradingRuleService.delete(id);
  }
}
