import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { PayrollService } from './payroll.service.js';
import {
  ExpenseCategoryEnum,
  PaymentMethodEnum,
  PayrollItemTypeEnum,
  PayrollStatusEnum,
  StaffSalaryTypeEnum,
} from '@repo/contracts';

describe('PayrollService (Unit)', () => {
  let service: PayrollService;
  let mockPayrollRepo: any;
  let mockPayrollItemRepo: any;
  let mockStaffRepo: any;
  let mockTeacherAttendanceRepo: any;
  let mockSchoolExpenseRepo: any;
  let mockDataSource: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPayrollRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({
        ...dto,
        id: 1,
        uuid: 'payroll-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: vi.fn(async (entity) => ({
        ...entity,
        id: entity.id ?? 1,
        uuid: entity.uuid ?? 'payroll-uuid-1',
      })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockPayrollItemRepo = {
      create: vi.fn((dto) => ({ ...dto, id: 10, uuid: 'item-uuid-10' })),
    };

    mockStaffRepo = {
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(5),
    };

    mockTeacherAttendanceRepo = {
      createQueryBuilder: vi.fn(),
    };

    mockSchoolExpenseRepo = {
      create: vi.fn((dto) => ({ ...dto, id: 50, uuid: 'expense-uuid-50' })),
    };

    const mockQueryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager: {
        save: vi.fn(async (entity) => {
          if (Array.isArray(entity)) {
            return entity.map((e, idx) => ({ ...e, id: idx + 1 }));
          }
          return { ...entity, id: entity.id ?? 1 };
        }),
        delete: vi.fn(),
      },
    };

    mockDataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    service = new PayrollService(
      mockPayrollRepo,
      mockPayrollItemRepo,
      mockStaffRepo,
      mockTeacherAttendanceRepo,
      mockSchoolExpenseRepo,
      mockDataSource,
      mockLogger,
    );
  });

  it('should create a monthly salary payroll with bonuses and deductions', async () => {
    mockStaffRepo.findOne.mockResolvedValue({
      id: 1,
      name: 'Vannak Meas',
      salaryType: StaffSalaryTypeEnum.MONTHLY,
      baseSalary: 1000,
    });

    mockPayrollRepo.findOne
      .mockResolvedValueOnce(null) // Duplicate check
      .mockResolvedValueOnce({
        id: 1,
        uuid: 'payroll-uuid-1',
        payrollNumber: 'PAY-202608-0001',
        staffId: 1,
        year: 2026,
        month: 8,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        workingDays: 22,
        holidayDays: 0,
        salaryType: StaffSalaryTypeEnum.MONTHLY,
        baseSalary: 1000,
        hourlyRate: 0,
        totalHoursWorked: 0,
        calculatedBaseAmount: 1000,
        totalBonus: 100,
        totalDeduction: 50,
        grossSalary: 1100,
        netSalary: 1050,
        status: PayrollStatusEnum.DRAFT,
        items: [
          {
            id: 1,
            itemType: PayrollItemTypeEnum.BONUS,
            title: 'Management Bonus',
            amount: 100,
          },
          {
            id: 2,
            itemType: PayrollItemTypeEnum.TAX,
            title: 'Tax',
            amount: 50,
          },
        ],
      });

    const result = await service.create({
      staffId: 1,
      year: 2026,
      month: 8,
      items: [
        {
          itemType: PayrollItemTypeEnum.BONUS,
          title: 'Management Bonus',
          amount: 100,
        },
        {
          itemType: PayrollItemTypeEnum.TAX,
          title: 'Tax',
          amount: 50,
        },
      ],
    });

    expect(result.calculatedBaseAmount).toBe(1000);
    expect(result.totalBonus).toBe(100);
    expect(result.totalDeduction).toBe(50);
    expect(result.grossSalary).toBe(1100);
    expect(result.netSalary).toBe(1050);
    expect(result.status).toBe(PayrollStatusEnum.DRAFT);
  });

  it('should create an hourly salary payroll with worked hours', async () => {
    mockStaffRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'John Doe',
      salaryType: StaffSalaryTypeEnum.HOURLY,
      hourlyRate: 20,
      baseSalary: 0,
    });

    mockPayrollRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        uuid: 'payroll-uuid-2',
        payrollNumber: 'PAY-202608-0002',
        staffId: 2,
        year: 2026,
        month: 8,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        workingDays: 22,
        holidayDays: 0,
        salaryType: StaffSalaryTypeEnum.HOURLY,
        hourlyRate: 20,
        totalHoursWorked: 40,
        calculatedBaseAmount: 800,
        totalBonus: 0,
        totalDeduction: 0,
        grossSalary: 800,
        netSalary: 800,
        status: PayrollStatusEnum.DRAFT,
      });

    const result = await service.create({
      staffId: 2,
      year: 2026,
      month: 8,
      totalHoursWorked: 40,
    });

    expect(result.totalHoursWorked).toBe(40);
    expect(result.hourlyRate).toBe(20);
    expect(result.calculatedBaseAmount).toBe(800);
    expect(result.netSalary).toBe(800);
  });

  it('should throw ConflictException on duplicate payroll period', async () => {
    mockStaffRepo.findOne.mockResolvedValue({ id: 1, name: 'Staff 1' });
    mockPayrollRepo.findOne.mockResolvedValue({
      id: 99,
      staffId: 1,
      year: 2026,
      month: 8,
      status: 'DRAFT',
    });

    await expect(
      service.create({
        staffId: 1,
        year: 2026,
        month: 8,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should process payment and automatically log school operational expense', async () => {
    mockPayrollRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        uuid: 'uuid-1',
        payrollNumber: 'PAY-202608-0001',
        month: 8,
        year: 2026,
        netSalary: 1050,
        status: 'DRAFT',
        staff: { id: 1, name: 'Vannak Meas' },
      })
      .mockResolvedValueOnce({
        id: 1,
        uuid: 'uuid-1',
        payrollNumber: 'PAY-202608-0001',
        month: 8,
        year: 2026,
        netSalary: 1050,
        status: 'PAID',
        paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
        paymentReference: 'TRX-12345',
        staff: { id: 1, name: 'Vannak Meas' },
      });

    const result = await service.processPayment(1, {
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      paymentReference: 'TRX-12345',
    });

    expect(result.status).toBe(PayrollStatusEnum.PAID);
    expect(mockSchoolExpenseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: ExpenseCategoryEnum.SALARY,
        amount: 1050,
        status: 'APPROVED',
        receiptRef: 'PAY-202608-0001',
      }),
    );
  });

  it('should throw ConflictException when trying to pay an already PAID payroll', async () => {
    mockPayrollRepo.findOne.mockResolvedValue({
      id: 1,
      status: 'PAID',
      staff: { id: 1 },
    });

    await expect(
      service.processPayment(1, {
        paymentMethod: PaymentMethodEnum.CASH,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should return correct payroll financial summary', async () => {
    const mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        {
          status: 'PAID',
          salaryType: 'MONTHLY',
          netSalary: 1050,
        },
        {
          status: 'DRAFT',
          salaryType: 'HOURLY',
          netSalary: 550,
        },
      ]),
    };
    mockPayrollRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const summary = await service.getSummary(2026, 8);
    expect(summary.totalPayrollSpend).toBe(1600);
    expect(summary.totalPaid).toBe(1050);
    expect(summary.totalDraft).toBe(550);
    expect(summary.paidCount).toBe(1);
    expect(summary.draftCount).toBe(1);
    expect(summary.monthlySpend).toBe(1050);
    expect(summary.hourlySpend).toBe(550);
    expect(summary.totalStaffCount).toBe(5);
  });
});
