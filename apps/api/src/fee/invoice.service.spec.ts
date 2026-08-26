import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import { InvoiceService } from './invoice.service.js';

describe('InvoiceService (Unit)', () => {
  let service: InvoiceService;
  let mockInvoiceRepo: any;
  let mockItemRepo: any;
  let mockFeeStructureRepo: any;
  let mockRefundRepo: any;
  let mockReminderRepo: any;
  let mockStudentRepo: any;

  beforeEach(() => {
    const mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      getCount: vi.fn().mockResolvedValue(1),
    };

    mockInvoiceRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn((data) => ({ ...data, id: 10, uuid: 'inv-uuid-1' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id ?? 10 })),
    };

    mockItemRepo = {
      create: vi.fn((data) => ({ ...data, id: 100 })),
      save: vi.fn(async (items) => items),
    };

    mockFeeStructureRepo = {
      findBy: vi.fn().mockResolvedValue([{ id: 1, name: 'Tuition Fee', amount: 150 }]),
    };

    mockRefundRepo = {
      create: vi.fn((data) => ({ ...data, id: 50 })),
      save: vi.fn(async (entity) => ({ ...entity, id: 50 })),
    };

    mockReminderRepo = {
      create: vi.fn((data) => ({ ...data, id: 60 })),
      save: vi.fn(async (entity) => ({ ...entity, id: 60 })),
    };

    mockStudentRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 1, firstName: 'John', lastName: 'Doe', classId: 5 }),
      findBy: vi.fn().mockResolvedValue([{ id: 1, firstName: 'John', lastName: 'Doe', classId: 5 }]),
    };

    service = new InvoiceService(
      mockInvoiceRepo,
      mockItemRepo,
      mockFeeStructureRepo,
      mockRefundRepo,
      mockReminderRepo,
      mockStudentRepo,
    );
  });

  it('should create an invoice for a student', async () => {
    mockInvoiceRepo.findOne.mockResolvedValue({
      id: 10,
      uuid: 'inv-uuid-1',
      invoiceNumber: 'INV-202608-0002',
      studentId: 1,
      billingYear: 2026,
      billingMonth: 8,
      issueDate: new Date(),
      subtotal: 150,
      discountAmount: 10,
      totalAmount: 140,
      amountPaid: 0,
      status: PaymentStatusEnum.UNPAID,
      items: [{ id: 100, title: 'Tuition Fee', amount: 150 }],
    });

    const dto = {
      studentId: 1,
      billingYear: 2026,
      billingMonth: 8,
      discountAmount: 10,
      items: [{ title: 'Tuition Fee', amount: 150 }],
    };

    const result = await service.create(dto);
    expect(result.studentId).toBe(1);
    expect(result.subtotal).toBe(150);
    expect(result.totalAmount).toBe(140);
  });

  it('should generate batch invoices for selected students', async () => {
    mockInvoiceRepo.findOne.mockResolvedValue({
      id: 10,
      invoiceNumber: 'INV-202608-0003',
      studentId: 1,
      billingYear: 2026,
      billingMonth: 8,
      totalAmount: 150,
      amountPaid: 0,
      status: PaymentStatusEnum.UNPAID,
    });

    const batchDto = {
      studentIds: [1],
      billingYear: 2026,
      billingMonth: 8,
      feeStructureIds: [1],
    };

    const res = await service.generateBatch(batchDto);
    expect(res.invoiceIds.length).toBe(1);
    expect(mockInvoiceRepo.save).toHaveBeenCalled();
  });

  it('should record payment and issue receipt number', async () => {
    mockInvoiceRepo.findOne
      .mockResolvedValueOnce({
        id: 10,
        billingYear: 2026,
        billingMonth: 8,
        totalAmount: 100,
        amountPaid: 0,
        status: PaymentStatusEnum.UNPAID,
      })
      .mockResolvedValueOnce({
        id: 10,
        billingYear: 2026,
        billingMonth: 8,
        totalAmount: 100,
        amountPaid: 100,
        status: PaymentStatusEnum.PAID,
      });

    const paymentDto = {
      invoiceId: 10,
      amountPaid: 100,
      paymentMethod: PaymentMethodEnum.CASH,
    };

    const res = await service.recordPayment(paymentDto);
    expect(res.receiptNumber).toBeDefined();
    expect(res.amountPaid).toBe(100);
  });

  it('should process payment refund correctly', async () => {
    mockInvoiceRepo.findOne
      .mockResolvedValueOnce({
        id: 10,
        amountPaid: 100,
        totalAmount: 100,
        status: PaymentStatusEnum.PAID,
      })
      .mockResolvedValueOnce({
        id: 10,
        amountPaid: 0,
        totalAmount: 100,
        status: PaymentStatusEnum.UNPAID,
      });

    const refundDto = {
      invoiceId: 10,
      amount: 100,
      reason: 'Overcharged by mistake',
      paymentMethod: PaymentMethodEnum.CASH,
    };

    const res = await service.refund(refundDto);
    expect(res.message).toBe('Refund processed successfully');
    expect(mockRefundRepo.save).toHaveBeenCalled();
  });

  it('should throw BadRequestException if refund exceeds amount paid', async () => {
    mockInvoiceRepo.findOne.mockResolvedValue({
      id: 10,
      amountPaid: 50,
      totalAmount: 100,
    });

    await expect(
      service.refund({ invoiceId: 10, amount: 100, reason: 'Invalid', paymentMethod: PaymentMethodEnum.CASH }),
    ).rejects.toThrow(BadRequestException);
  });
});
