import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UseAbility } from 'nest-casl';
import { Actions } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import type { User } from '@src/user/entity/user.entity.js';

import { SchoolExpense } from './entity/school-expense.entity.js';
import { ExpenseService } from './expense.service.js';
import {
  CreateSchoolExpenseDto,
  UpdateSchoolExpenseDto,
  ApproveSchoolExpenseDto,
  FindSchoolExpensesDto,
} from './dto/fee.dto.js';

@Controller('admin/fees/expenses')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Get()
  @UseAbility(Actions.read, SchoolExpense)
  async findAll(@Query() query: FindSchoolExpensesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseAbility(Actions.read, SchoolExpense)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseAbility(Actions.create, SchoolExpense)
  async create(
    @Body() dto: CreateSchoolExpenseDto,
    @CurrentUser() user: User,
  ) {
    return this.service.create(dto, user?.id);
  }

  @Put(':id')
  @UseAbility(Actions.update, SchoolExpense)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSchoolExpenseDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseAbility(Actions.delete, SchoolExpense)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }

  @Post(':id/approve')
  @UseAbility(Actions.update, SchoolExpense)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveSchoolExpenseDto,
    @CurrentUser() user: User,
  ) {
    return this.service.approve(id, dto, user?.id);
  }
}
