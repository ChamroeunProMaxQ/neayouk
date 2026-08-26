import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';

import { FeeStructure } from './entity/fee-structure.entity.js';
import { PaymentRefund } from './entity/payment-refund.entity.js';
import { PaymentReminder } from './entity/payment-reminder.entity.js';
import { SchoolExpense } from './entity/school-expense.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { PaymentItem } from '@src/student/entity/payment-item.entity.js';

import { FeeStructureService } from './fee-structure.service.js';
import { FeeStructureController } from './fee-structure.controller.js';
import { InvoiceService } from './invoice.service.js';
import { InvoiceController } from './invoice.controller.js';
import { ExpenseService } from './expense.service.js';
import { ExpenseController } from './expense.controller.js';
import { FeeSummaryService } from './fee-summary.service.js';
import { FeeSummaryController } from './fee-summary.controller.js';

import { permissions } from './fee.permission.js';
import { AuthModule } from '@src/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructure,
      PaymentRefund,
      PaymentReminder,
      SchoolExpense,
      Student,
      StudentPayment,
      PaymentItem,
    ]),
    CaslModule.forFeature({ permissions }),
    AuthModule,
  ],
  controllers: [
    FeeStructureController,
    InvoiceController,
    ExpenseController,
    FeeSummaryController,
  ],
  providers: [
    FeeStructureService,
    InvoiceService,
    ExpenseService,
    FeeSummaryService,
  ],
  exports: [
    FeeStructureService,
    InvoiceService,
    ExpenseService,
    FeeSummaryService,
  ],
})
export class FeeModule {}
