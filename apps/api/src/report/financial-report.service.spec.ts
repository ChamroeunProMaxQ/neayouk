import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentStatusEnum, ExpenseStatusEnum, ReportDatePresetEnum } from '@repo/contracts';
import { FinancialReportService } from './financial-report.service.js';

describe('FinancialReportService (Unit)', () => {
  let service: FinancialReportService;
  let mockPaymentRepo: any;
  let mockPaymentItemRepo: any;
  let mockExpenseRepo: any;
  let mockPayrollRepo: any;

  beforeEach(() => {
    mockPaymentRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockPaymentItemRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockExpenseRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockPayrollRepo = {
      createQueryBuilder: vi.fn(),
    };

    service = new FinancialReportService(
      mockPaymentRepo,
      mockPaymentItemRepo,
      mockExpenseRepo,
      mockPayrollRepo,
    );
  });

  it('should compute financial summary metrics correctly', async () => {
    const mockPayments = [
      {
        id: 1,
        amountPaid: 500,
        amountDue: 0,
        totalAmount: 500,
        status: PaymentStatusEnum.PAID,
        paymentMethod: 'CASH',
        createdAt: new Date('2026-02-15'),
      },
      {
        id: 2,
        amountPaid: 300,
        amountDue: 200,
        totalAmount: 500,
        status: PaymentStatusEnum.PARTIAL,
        paymentMethod: 'BANK_TRANSFER',
        createdAt: new Date('2026-02-16'),
      },
    ];

    const mockExpenses = [
      {
        id: 1,
        amount: 200,
        category: 'UTILITIES',
        status: ExpenseStatusEnum.APPROVED,
        expenseDate: '2026-02-10',
      },
    ];

    const mockPayrolls = [
      {
        id: 1,
        year: 2026,
        month: 2,
        netSalary: 400,
        status: 'PAID',
        createdAt: new Date('2026-02-28'),
      },
    ];

    const mockPaymentItems = [
      { id: 1, feeStructure: { category: 'TUITION' }, title: 'Tuition Fee', amount: 800 },
    ];

    const createQbMock = (data: any) => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(data),
    });

    mockPaymentRepo.createQueryBuilder.mockReturnValue(createQbMock(mockPayments));
    mockExpenseRepo.createQueryBuilder.mockReturnValue(createQbMock(mockExpenses));
    mockPayrollRepo.createQueryBuilder.mockReturnValue(createQbMock(mockPayrolls));
    mockPaymentItemRepo.createQueryBuilder.mockReturnValue(createQbMock(mockPaymentItems));

    const result = await service.getSummary({ preset: ReportDatePresetEnum.THIS_MONTH });

    expect(result.totalRevenue).toBe(800);
    expect(result.totalOutstanding).toBe(200);
    expect(result.totalExpenses).toBe(200);
    expect(result.totalPayroll).toBe(400);
    expect(result.netOperatingMargin).toBe(200); // 800 - (200 + 400)
    expect(result.totalInvoicesCount).toBe(2);
    expect(result.paidInvoicesCount).toBe(1);
  });

  it('should generate CSV export of combined transaction ledgers', async () => {
    const mockPayments = [
      {
        id: 1,
        paymentNumber: 'INV-1001',
        student: { firstName: 'Sokha', lastName: 'Chan' },
        totalAmount: 500,
        amountPaid: 500,
        status: 'PAID',
        paymentMethod: 'CASH',
        createdAt: new Date('2026-02-15'),
      },
    ];
    const mockExpenses = [
      {
        id: 1,
        receiptRef: 'EXP-5001',
        title: 'Electricity Bill',
        vendor: 'EDC',
        category: 'UTILITIES',
        amount: 150,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        expenseDate: '2026-02-12',
      },
    ];

    const createQbMock = (data: any) => ({
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(data),
    });

    mockPaymentRepo.createQueryBuilder.mockReturnValue(createQbMock(mockPayments));
    mockExpenseRepo.createQueryBuilder.mockReturnValue(createQbMock(mockExpenses));

    const csv = await service.exportCsv({});
    expect(csv).toContain('Transaction Type');
    expect(csv).toContain('STUDENT_INVOICE');
    expect(csv).toContain('SCHOOL_EXPENSE');
    expect(csv).toContain('Chan Sokha');
    expect(csv).toContain('EDC');
  });
});
