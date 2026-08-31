import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentStatusEnum,
  ExpenseStatusEnum,
  type FinancialReportQueryDto,
  type FinancialReportSummaryDto,
} from '@repo/contracts';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { PaymentItem } from '@src/student/entity/payment-item.entity.js';
import { SchoolExpense } from '@src/fee/entity/school-expense.entity.js';
import { Payroll } from '@src/hr/entity/payroll.entity.js';
import { resolveDateRange } from './helper/report-date.helper.js';
import {
  applyBranchScoping,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class FinancialReportService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,

    @InjectRepository(PaymentItem)
    private readonly paymentItemRepo: Repository<PaymentItem>,

    @InjectRepository(SchoolExpense)
    private readonly expenseRepo: Repository<SchoolExpense>,

    @InjectRepository(Payroll)
    private readonly payrollRepo: Repository<Payroll>,
  ) { }

  async getSummary(
    query: FinancialReportQueryDto,
    currentUser?: AuthContext,
  ): Promise<FinancialReportSummaryDto> {
    const range = resolveDateRange(query.preset, query.startDate, query.endDate);

    // 1. Student Payments Revenue (Current Period)
    const paymentQb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :start AND p.created_at <= :end', {
        start: `${range.startDate} 00:00:00`,
        end: `${range.endDate} 23:59:59`,
      });

    applyBranchScoping(paymentQb, 'p', currentUser, (query as any).branchId);

    if (query.academicYear) {
      paymentQb.andWhere('p.billing_year = :year', {
        year: parseInt(query.academicYear.split('-')[0] || query.academicYear, 10),
      });
    }
    if (query.classId) {
      paymentQb.andWhere('p.class_id = :classId', { classId: query.classId });
    }

    const allPayments = await paymentQb.getMany();

    const totalRevenue = allPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid || 0),
      0,
    );
    const totalOutstanding = allPayments
      .filter((p) => p.status !== PaymentStatusEnum.PAID && p.status !== PaymentStatusEnum.WAIVED)
      .reduce((sum, p) => sum + Number(p.amountDue || Math.max(0, Number(p.totalAmount || 0) - Number(p.amountPaid || 0))), 0);

    const totalInvoicesCount = allPayments.length;
    const paidInvoicesCount = allPayments.filter((p) => p.status === PaymentStatusEnum.PAID).length;
    const unpaidInvoicesCount = allPayments.filter((p) => p.status === PaymentStatusEnum.UNPAID || p.status === PaymentStatusEnum.PARTIAL).length;
    const overdueInvoicesCount = allPayments.filter((p) => p.status === PaymentStatusEnum.OVERDUE).length;

    // Previous Period Revenue for growth comparison
    const prevPaymentQb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :start AND p.created_at <= :end', {
        start: `${range.prevStartDate} 00:00:00`,
        end: `${range.prevEndDate} 23:59:59`,
      });

    applyBranchScoping(prevPaymentQb, 'p', currentUser, (query as any).branchId);

    if (query.classId) {
      prevPaymentQb.andWhere('p.class_id = :classId', { classId: query.classId });
    }
    const prevPayments = await prevPaymentQb.getMany();
    const previousPeriodRevenue = prevPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid || 0),
      0,
    );

    const revenueGrowthRate =
      previousPeriodRevenue > 0
        ? Number((((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1))
        : totalRevenue > 0
          ? 100
          : 0;

    // 2. School Operating Expenses
    const expenseQb = this.expenseRepo
      .createQueryBuilder('exp')
      .where('exp.expense_date >= :startDate AND exp.expense_date <= :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .andWhere('exp.status IN (:...statuses)', {
        statuses: [ExpenseStatusEnum.APPROVED, ExpenseStatusEnum.PAID],
      });

    applyBranchScoping(expenseQb, 'exp', currentUser, (query as any).branchId);

    const expenses = await expenseQb.getMany();
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 3. Staff Payroll Disbursed
    const payrollQb = this.payrollRepo
      .createQueryBuilder('pay')
      .where('pay.created_at >= :start AND pay.created_at <= :end', {
        start: `${range.startDate} 00:00:00`,
        end: `${range.endDate} 23:59:59`,
      })
      .andWhere('pay.status = :status', { status: 'PAID' });

    applyBranchScoping(payrollQb, 'pay', currentUser, (query as any).branchId);

    const payrolls = await payrollQb.getMany();
    const totalPayroll = payrolls.reduce((sum, py) => sum + Number(py.netSalary || py.grossSalary || 0), 0);

    // 4. Net Operating Margin & Collection Rate
    const netOperatingMargin = totalRevenue - (totalExpenses + totalPayroll);
    const totalBilled = totalRevenue + totalOutstanding;
    const collectionRate =
      totalBilled > 0 ? Number(((totalRevenue / totalBilled) * 100).toFixed(1)) : 100;

    // 5. Monthly Trends (Last 6-12 months breakdown)
    const monthMap = new Map<string, { revenue: number; expense: number; payroll: number }>();

    allPayments.forEach((p) => {
      const m = (p.createdAt ? new Date(p.createdAt) : new Date()).toISOString().slice(0, 7);
      const curr = monthMap.get(m) || { revenue: 0, expense: 0, payroll: 0 };
      curr.revenue += Number(p.amountPaid || 0);
      monthMap.set(m, curr);
    });

    expenses.forEach((e) => {
      const m = typeof e.expenseDate === 'string'
        ? e.expenseDate.slice(0, 7)
        : (e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7));
      const curr = monthMap.get(m) || { revenue: 0, expense: 0, payroll: 0 };
      curr.expense += Number(e.amount || 0);
      monthMap.set(m, curr);
    });

    payrolls.forEach((py) => {
      const m = `${py.year}-${String(py.month).padStart(2, '0')}`;
      const curr = monthMap.get(m) || { revenue: 0, expense: 0, payroll: 0 };
      curr.payroll += Number(py.netSalary || 0);
      monthMap.set(m, curr);
    });

    const sortedMonths = Array.from(monthMap.keys()).sort();
    if (sortedMonths.length === 0) {
      const currM = new Date().toISOString().slice(0, 7);
      sortedMonths.push(currM);
      monthMap.set(currM, { revenue: totalRevenue, expense: totalExpenses, payroll: totalPayroll });
    }

    const monthlyTrends = sortedMonths.map((month) => {
      const data = monthMap.get(month) || { revenue: 0, expense: 0, payroll: 0 };
      return {
        month,
        revenue: Math.round(data.revenue),
        expense: Math.round(data.expense),
        payroll: Math.round(data.payroll),
        net: Math.round(data.revenue - (data.expense + data.payroll)),
      };
    });

    // 6. Revenue by Category
    const itemQb = this.paymentItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.feeStructure', 'feeStructure')
      .innerJoin('item.payment', 'p')
      .where('p.created_at >= :start AND p.created_at <= :end', {
        start: `${range.startDate} 00:00:00`,
        end: `${range.endDate} 23:59:59`,
      });

    applyBranchScoping(itemQb, 'p', currentUser, (query as any).branchId);

    if (query.academicYear) {
      itemQb.andWhere('p.billing_year = :year', {
        year: parseInt(query.academicYear.split('-')[0] || query.academicYear, 10),
      });
    }
    if (query.classId) {
      itemQb.andWhere('p.class_id = :classId', { classId: query.classId });
    }

    const items = await itemQb.getMany();

    const revenueCatMap = new Map<string, number>();
    items.forEach((it) => {
      const cat = it.feeStructure?.category || 'OTHER';
      revenueCatMap.set(cat, (revenueCatMap.get(cat) || 0) + Number(it.amount || 0));
    });

    const revenueTotalCat = Array.from(revenueCatMap.values()).reduce((a, b) => a + b, 0) || totalRevenue || 1;
    const revenueByCategory = Array.from(revenueCatMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: Number(((amount / revenueTotalCat) * 100).toFixed(1)),
    }));

    if (revenueByCategory.length === 0 && totalRevenue > 0) {
      revenueByCategory.push({ category: 'TUITION', amount: totalRevenue, percentage: 100 });
    }

    // 7. Expenses by Category
    const expenseCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || 'OTHER';
      expenseCatMap.set(cat, (expenseCatMap.get(cat) || 0) + Number(e.amount || 0));
    });
    if (totalPayroll > 0) {
      expenseCatMap.set('SALARY', (expenseCatMap.get('SALARY') || 0) + totalPayroll);
    }

    const totalExpenseAll = (totalExpenses + totalPayroll) || 1;
    const expenseByCategory = Array.from(expenseCatMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: Number(((amount / totalExpenseAll) * 100).toFixed(1)),
    }));

    // 8. Payment Methods Distribution
    const methodMap = new Map<string, { count: number; amount: number }>();
    allPayments.forEach((p) => {
      const meth = p.paymentMethod || 'CASH';
      const curr = methodMap.get(meth) || { count: 0, amount: 0 };
      curr.count += 1;
      curr.amount += Number(p.amountPaid || 0);
      methodMap.set(meth, curr);
    });

    const paymentMethodsDistribution = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: Math.round(data.amount),
      percentage: totalRevenue > 0 ? Number(((data.amount / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    return {
      totalRevenue: Math.round(totalRevenue),
      totalOutstanding: Math.round(totalOutstanding),
      totalExpenses: Math.round(totalExpenses),
      totalPayroll: Math.round(totalPayroll),
      netOperatingMargin: Math.round(netOperatingMargin),
      collectionRate,
      previousPeriodRevenue: Math.round(previousPeriodRevenue),
      revenueGrowthRate,
      totalInvoicesCount,
      paidInvoicesCount,
      unpaidInvoicesCount,
      overdueInvoicesCount,
      monthlyTrends,
      revenueByCategory,
      expenseByCategory,
      paymentMethodsDistribution,
    };
  }

  async exportCsv(
    query: FinancialReportQueryDto,
    currentUser?: AuthContext,
  ): Promise<string> {
    const range = resolveDateRange(query.preset, query.startDate, query.endDate);

    const paymentQb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 'student')
      .leftJoinAndSelect('p.class', 'class')
      .where('p.created_at >= :start AND p.created_at <= :end', {
        start: `${range.startDate} 00:00:00`,
        end: `${range.endDate} 23:59:59`,
      })
      .orderBy('p.created_at', 'DESC');

    applyBranchScoping(paymentQb, 'p', currentUser, (query as any).branchId);

    if (query.classId) {
      paymentQb.andWhere('p.class_id = :classId', { classId: query.classId });
    }
    const payments = await paymentQb.getMany();

    const expenseQb = this.expenseRepo
      .createQueryBuilder('exp')
      .where('exp.expense_date >= :startDate AND exp.expense_date <= :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .orderBy('exp.expense_date', 'DESC');

    applyBranchScoping(expenseQb, 'exp', currentUser, (query as any).branchId);
    const expenses = await expenseQb.getMany();

    const headers = [
      'Date',
      'Transaction Type',
      'Reference No',
      'Party / Name',
      'Category',
      'Payment Method',
      'Total Amount ($)',
      'Paid Amount ($)',
      'Status',
      'Notes',
    ];

    const rows: string[][] = [];

    payments.forEach((p) => {
      const studentName = p.student ? `${p.student.lastName} ${p.student.firstName}` : 'Student';
      const dateStr = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '';
      rows.push([
        dateStr,
        'STUDENT_INVOICE',
        p.paymentNumber || p.receiptNumber || `INV-${p.id}`,
        studentName,
        'TUITION_FEE',
        p.paymentMethod || 'CASH',
        String(p.totalAmount || 0),
        String(p.amountPaid || 0),
        p.status || 'PAID',
        p.notes || '',
      ]);
    });

    expenses.forEach((e) => {
      const dateStr = typeof e.expenseDate === 'string'
        ? e.expenseDate
        : (e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '');
      rows.push([
        dateStr,
        'SCHOOL_EXPENSE',
        e.receiptRef || `EXP-${e.id}`,
        e.vendor || e.title,
        e.category || 'OTHER',
        e.paymentMethod || 'CASH',
        String(e.amount || 0),
        String(e.amount || 0),
        e.status || 'PAID',
        e.notes || '',
      ]);
    });

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
