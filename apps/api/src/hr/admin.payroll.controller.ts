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
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { HttpMessage } from '@src/common/decorator/message.decorator.js';
import { PayrollService } from './payroll.service.js';
import { Payroll } from './entity/payroll.entity.js';
import { PayrollHook } from './hr.hook.js';
import {
  CreatePayrollDto,
  FindPayrollsDto,
  ProcessPayrollPaymentDto,
  UpdatePayrollDto,
} from './dto/payroll.dto.js';

@ApiTags('Admin HR Payrolls')
@ApiBearerAuth()
@Controller('admin/hr/payrolls')
export class AdminPayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Payroll)
  @Get('summary')
  @HttpMessage('Payroll summary retrieved successfully')
  getSummary(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.payrollService.getSummary(
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN)
  @UseAbility(DefaultActions.read, Payroll)
  @Get()
  @HttpMessage('Payrolls retrieved successfully')
  findAll(@Query() dto: FindPayrollsDto) {
    return this.payrollService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.read, Payroll, PayrollHook)
  @Get(':id')
  @HttpMessage('Payroll details retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.create, Payroll)
  @Post()
  @HttpMessage('Payroll created successfully')
  create(
    @Body() dto: CreatePayrollDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.payrollService.create(dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Payroll, PayrollHook)
  @Patch(':id')
  @HttpMessage('Payroll updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayrollDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.payrollService.update(id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.update, Payroll, PayrollHook)
  @Post(':id/pay')
  @HttpMessage('Payroll payment recorded successfully')
  processPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessPayrollPaymentDto,
    @CurrentUser('sub') currentUserId: number,
  ) {
    return this.payrollService.processPayment(id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, CaslAccessGuard)
  @UseAbility(DefaultActions.delete, Payroll, PayrollHook)
  @Delete(':id')
  @HttpMessage('Payroll deleted successfully')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.remove(id);
  }
}
