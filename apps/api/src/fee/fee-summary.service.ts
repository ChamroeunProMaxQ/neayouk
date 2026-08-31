import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatusEnum, ExpenseStatusEnum, type FeeSummary } from '@repo/contracts';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { SchoolExpense } from './entity/school-expense.entity.js';
import {
  applyBranchScoping,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class FeeSummaryService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,

    @InjectRepository(SchoolExpense)
    private readonly expenseRepo: Repository<SchoolExpense>,
  ) {}

  async getSummary(currentUser?: AuthContext): Promise<FeeSummary> {
    // 1. Total Revenue Collected (Sum of all student_payments amount_paid)
    const revenueQb = this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount_paid)', 'total');
    applyBranchScoping(revenueQb, 'p', currentUser);
    const revenueResult = await revenueQb.getRawOne();

    const totalRevenueCollected = Number(revenueResult?.total ?? 0);

    // 2. Outstanding & Overdue Receivables
    const outstandingQb = this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(GREATEST(p.total_amount, p.amount_due) - p.amount_paid)', 'total')
      .where('p.status IN (:...statuses)', {
        statuses: [PaymentStatusEnum.UNPAID, PaymentStatusEnum.OVERDUE, PaymentStatusEnum.PARTIAL],
      });
    applyBranchScoping(outstandingQb, 'p', currentUser);
    const outstandingResult = await outstandingQb.getRawOne();

    const totalOutstandingOverdue = Math.max(0, Number(outstandingResult?.total ?? 0));

    // 3. Operational Expenses (Approved & Paid)
    const expenseQb = this.expenseRepo
      .createQueryBuilder('exp')
      .select('SUM(exp.amount)', 'total')
      .where('exp.status IN (:...statuses)', {
        statuses: [ExpenseStatusEnum.APPROVED, ExpenseStatusEnum.PAID],
      });
    applyBranchScoping(expenseQb, 'exp', currentUser);
    const expenseResult = await expenseQb.getRawOne();
    const totalApprovedExpenses = Number(expenseResult?.total ?? 0);

    // 4. Pending Expenses Count
    const pendingExpenseQb = this.expenseRepo
      .createQueryBuilder('exp')
      .where('exp.status = :status', { status: ExpenseStatusEnum.PENDING });
    applyBranchScoping(pendingExpenseQb, 'exp', currentUser);
    const pendingExpensesCount = await pendingExpenseQb.getCount();

    // 5. Unpaid Payments Count
    const unpaidInvoiceQb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status IN (:...statuses)', {
        statuses: [PaymentStatusEnum.UNPAID, PaymentStatusEnum.OVERDUE],
      });
    applyBranchScoping(unpaidInvoiceQb, 'p', currentUser);
    const unpaidInvoicesCount = await unpaidInvoiceQb.getCount();

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
