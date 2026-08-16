import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  PaymentStatusEnum,
  PaymentMethodEnum,
  ClassEnrollmentStatusEnum,
} from '@repo/contracts';
import { StudentPaymentService } from './student-payment.service.js';

describe('StudentPaymentService (Unit)', () => {
  let service: StudentPaymentService;
  let mockPaymentRepo: any;
  let mockStudentRepo: any;
  let mockClassRepo: any;
  let mockStudentClassRepo: any;

  beforeEach(() => {
    mockPaymentRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 1, toJSON: () => ({ ...data, id: 1 }) })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id ?? 1 })),
    };

    mockStudentRepo = {
      findOne: vi.fn(),
    };

    mockClassRepo = {
      findOne: vi.fn(),
    };

    mockStudentClassRepo = {
      findOne: vi.fn(),
    };

    service = new StudentPaymentService(
      mockPaymentRepo,
      mockStudentRepo,
      mockClassRepo,
      mockStudentClassRepo,
    );
  });

  describe('recordPayment', () => {
    it('should throw NotFoundException if student is not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.recordPayment({
          studentId: 999,
          billingYear: 2026,
          billingMonth: 4,
          amountPaid: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record full payment with PAID status when amountPaid >= amountDue', async () => {
      const student = {
        id: 1,
        discount: 10,
        enrollments: [
          {
            isPrimary: true,
            classId: 10,
            status: ClassEnrollmentStatusEnum.ENROLLED,
          },
        ],
      };
      mockStudentRepo.findOne.mockResolvedValueOnce(student);
      mockPaymentRepo.findOne.mockResolvedValueOnce(null);
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 10, monthlyFee: 50.0 });

      const result = await service.recordPayment({
        studentId: 1,
        billingYear: 2026,
        billingMonth: 4,
        amountPaid: 40, // Base 50 - 10 discount = 40 net due
        paymentMethod: PaymentMethodEnum.KHQR,
        receiptNumber: 'REC-001',
      });

      expect(mockPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          billingYear: 2026,
          billingMonth: 4,
          amountDue: 40,
          amountPaid: 40,
          discountApplied: 10,
          status: PaymentStatusEnum.PAID,
          paymentMethod: PaymentMethodEnum.KHQR,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should set PARTIAL status when amountPaid is less than net amount due', async () => {
      const student = {
        id: 1,
        discount: 0,
        enrollments: [
          {
            isPrimary: true,
            classId: 10,
            status: ClassEnrollmentStatusEnum.ENROLLED,
          },
        ],
      };
      mockStudentRepo.findOne.mockResolvedValueOnce(student);
      mockPaymentRepo.findOne.mockResolvedValueOnce(null);
      mockClassRepo.findOne.mockResolvedValueOnce({ id: 10, monthlyFee: 60.0 });

      await service.recordPayment({
        studentId: 1,
        billingYear: 2026,
        billingMonth: 4,
        amountPaid: 20, // Net due is 60, paid 20
      });

      expect(mockPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amountDue: 60,
          amountPaid: 20,
          status: PaymentStatusEnum.PARTIAL,
        }),
      );
    });
  });

  describe('getStudentPaymentSummary', () => {
    it('should compute full timeline with 0 unpaid months when all payments are PAID', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Student registered this month and paid fully
      const student = {
        id: 1,
        discount: 0,
        registeredAt: new Date(currentYear, currentMonth - 1, 1),
        enrollments: [
          {
            isPrimary: true,
            status: ClassEnrollmentStatusEnum.ENROLLED,
            class: { id: 10, monthlyFee: 50.0 },
          },
        ],
        payments: [
          {
            billingYear: currentYear,
            billingMonth: currentMonth,
            amountDue: 50,
            amountPaid: 50,
            status: PaymentStatusEnum.PAID,
            paidAt: new Date(),
            toJSON: () => ({ billingYear: currentYear, billingMonth: currentMonth }),
          },
        ],
      };

      const summary = await service.getStudentPaymentSummary(student as any);

      expect(summary.totalPaidAmount).toBe(50);
      expect(summary.totalUnpaidMonths).toBe(0);
      expect(summary.totalOutstandingAmount).toBe(0);
      expect(summary.unpaidMonthsList.length).toBe(0);
    });

    it('should identify unpaid months when student has registered past months without payment', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Student registered 2 months ago without any payments
      const regDate = new Date(currentYear, 0, 1); // January
      const student = {
        id: 2,
        discount: 5,
        registeredAt: regDate,
        enrollments: [
          {
            isPrimary: true,
            status: ClassEnrollmentStatusEnum.ENROLLED,
            class: { id: 10, monthlyFee: 55.0 },
          },
        ],
        payments: [],
      };

      const summary = await service.getStudentPaymentSummary(student as any);

      expect(summary.totalPaidAmount).toBe(0);
      expect(summary.totalUnpaidMonths).toBeGreaterThan(0);
      expect(summary.totalOutstandingAmount).toBeGreaterThan(0);
      expect(summary.unpaidMonthsList[0].amountDue).toBe(50); // 55 - 5 discount
    });
  });
});
