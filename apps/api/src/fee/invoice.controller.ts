import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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

import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { InvoiceService } from './invoice.service.js';
import {
  CreateInvoiceDto,
  GenerateBatchInvoicesDto,
  RecordInvoicePaymentDto,
  RefundPaymentDto,
  PaymentReminderDto,
  FindInvoicesDto,
} from './dto/fee.dto.js';

@Controller('admin/fees/invoices')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get()
  @UseAbility(Actions.read, StudentPayment)
  async findAll(@Query() query: FindInvoicesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseAbility(Actions.read, StudentPayment)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseAbility(Actions.create, StudentPayment)
  async create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Post('batch-generate')
  @UseAbility(Actions.create, StudentPayment)
  async generateBatch(@Body() dto: GenerateBatchInvoicesDto) {
    return this.service.generateBatch(dto);
  }

  @Post(':id/pay')
  @UseAbility(Actions.update, StudentPayment)
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordInvoicePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.recordPayment({ ...dto, invoiceId: id }, user?.id);
  }

  @Post(':id/refund')
  @UseAbility(Actions.update, StudentPayment)
  async refund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.refund({ ...dto, invoiceId: id }, user?.id);
  }

  @Post(':id/reminder')
  @UseAbility(Actions.update, StudentPayment)
  async sendReminder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PaymentReminderDto,
    @CurrentUser() user: User,
  ) {
    return this.service.sendReminder({ ...dto, invoiceId: id }, user?.id);
  }
}
