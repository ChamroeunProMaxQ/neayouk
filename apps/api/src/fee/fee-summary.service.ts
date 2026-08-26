import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaymentStatusEnum, ExpenseStatusEnum, type FeeSummary } from '@repo/contracts';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { SchoolExpense } from './entity/school-expense.entity.js';

@Injectable()
export class FeeSummaryService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,

    @InjectRepository(SchoolExpense)
    private readonly expenseRepo: Repository<SchoolExpense>,
  ) {}

  async getSummary(): Promise<FeeSummary> {
    // 1. Total Revenue Collected (Sum of all student_payments amount_paid)
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount_paid)', 'total')
      .getRawOne();

    const totalRevenueCollected = Number(revenueResult?.total ?? 0);

    // 2. Outstanding & Overdue Receivables
    const outstandingResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(GREATEST(p.total_amount, p.amount_due) - p.amount_paid)', 'total')
      .where('p.status IN (:...statuses)', {
        statuses: [PaymentStatusEnum.UNPAID, PaymentStatusEnum.OVERDUE, PaymentStatusEnum.PARTIAL],
      })
      .getRawOne();

    const totalOutstandingOverdue = Math.max(0, Number(outstandingResult?.total ?? 0));

    // 3. Operational Expenses (Approved & Paid)
    const expenseResult = await this.expenseRepo
      .createQueryBuilder('exp')
      .select('SUM(exp.amount)', 'total')
      .where('exp.status IN (:...statuses)', {
        statuses: [ExpenseStatusEnum.APPROVED, ExpenseStatusEnum.PAID],
      })
      .getRawOne();
    const totalApprovedExpenses = Number(expenseResult?.total ?? 0);

    // 4. Pending Expenses Count
    const pendingExpensesCount = await this.expenseRepo.count({
      where: { status: ExpenseStatusEnum.PENDING },
    });

    // 5. Unpaid Payments Count
    const unpaidInvoicesCount = await this.paymentRepo.count({
      where: { status: In([PaymentStatusEnum.UNPAID, PaymentStatusEnum.OVERDUE]) },
    });

    // 6. Net Operating Balance
    const netOperatingBalance = totalRevenueCollected - totalApprovedExpenses;

    return {
      totalRevenueCollected,
      totalOutstandingOverdue,
      totalApprovedExpenses,
      netOperatingBalance,
      pendingExpensesCount,
      unpaidInvoicesCount,
    };
  }
}
