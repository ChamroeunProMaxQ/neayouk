import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum, FeeCategoryEnum, BillingCycleEnum, PaymentMethodEnum, ExpenseCategoryEnum, ExpenseStatusEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('Fee & Billing Module (e2e - All 6 Condition Categories)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    adminToken = ctx.createToken({
      sub: 1,
      username: 'admin',
      type: UserTypeEnum.ADMIN,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  let createdFeeId: number;
  let createdStudentId: number;
  let createdInvoiceId: number;
  let createdExpenseId: number;

  // 1. Authentication & Authorization Guards (401 / 403)
  describe('Category 5: Authentication & Authorization Guards', () => {
    it('should return 401 Unauthorized when requesting fee structures without token', async () => {
      await request(server).get('/api/v1/admin/fees/structures').expect(401);
    });

    it('should return 401 Unauthorized when creating fee structures without token', async () => {
      await request(server).post('/api/v1/admin/fees/structures').send({ name: 'Test Fee' }).expect(401);
    });
  });

  // 2. Fee Structures CRUD & Validation
  describe('Fee Structures API', () => {
    it('Category 2: Validation Failures - should return 400 Bad Request on invalid fee creation payload', async () => {
      await request(server)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -50 }) // Missing required name
        .expect(400);
    });

    it('Category 1: Happy Path - should create a new fee structure variant', async () => {
      const res = await request(server)
        .post('/api/v1/admin/fees/structures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'School Uniform - Size M',
          category: FeeCategoryEnum.OTHER,
          amount: 15.0,
          billingCycle: BillingCycleEnum.ONE_TIME,
          isOptional: true,
          description: 'Standard school uniform shirt and pants',
        })
        .expect(201);

      expect(res.body.data.name).toBe('School Uniform - Size M');
      expect(res.body.data.amount).toBe(15);
      createdFeeId = res.body.data.id;
    });

    it('Category 1: Happy Path - should list fee structures with pagination', async () => {
      const res = await request(server)
        .get('/api/v1/admin/fees/structures?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('Category 4: Resource Not Found - should return 404 for non-existent fee structure', async () => {
      await request(server)
        .get('/api/v1/admin/fees/structures/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // 3. Student Invoices API
  describe('Student Invoices API', () => {
    beforeAll(async () => {
      // Create a test student
      const res = await request(server)
        .post('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Alice',
          lastName: 'FeeTest',
          gender: 'FEMALE',
          studentCode: `STU-FEE-${Date.now()}`,
        });
      createdStudentId = res.body.data.id;
    });

    it('Category 1: Happy Path - should create a single invoice with line items', async () => {
      const res = await request(server)
        .post('/api/v1/admin/fees/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: createdStudentId,
          billingYear: 2026,
          billingMonth: 8,
          discountAmount: 5.0,
          items: [
            { feeStructureId: createdFeeId, title: 'School Uniform - Size M', amount: 15.0 },
            { title: 'Registration Fee', amount: 50.0 },
          ],
        })
        .expect(201);

      expect(res.body.data.studentId).toBe(createdStudentId);
      expect(res.body.data.subtotal).toBe(65);
      expect(res.body.data.discountAmount).toBe(5);
      expect(res.body.data.totalAmount).toBe(60);
      createdInvoiceId = res.body.data.id;
    });

    it('Category 1: Happy Path - should record payment and issue receipt number', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/fees/invoices/${createdInvoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountPaid: 60.0,
          paymentMethod: PaymentMethodEnum.CASH,
        })
        .expect(201);

      expect(res.body.data.receiptNumber).toMatch(/^REC-202608-/);
      expect(res.body.data.invoice.status).toBe('PAID');
    });

    it('Category 6: Edge & Boundary - should process refund correctly', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/fees/invoices/${createdInvoiceId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 60.0,
          reason: 'Duplicate payment refund',
          paymentMethod: PaymentMethodEnum.CASH,
        })
        .expect(201);

      expect(res.body.data.message).toBe('Refund processed successfully');
    });
  });

  // 4. Operational Expenses API (2-step approval workflow)
  describe('School Expenses API', () => {
    it('Category 1: Happy Path - should create an expense with PENDING status', async () => {
      const res = await request(server)
        .post('/api/v1/admin/fees/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Office Stationery Purchase',
          category: ExpenseCategoryEnum.SUPPLIES,
          amount: 45.50,
          expenseDate: '2026-08-20',
          vendor: 'Central Paper Supply',
        })
        .expect(201);

      expect(res.body.data.title).toBe('Office Stationery Purchase');
      expect(res.body.data.status).toBe(ExpenseStatusEnum.PENDING);
      createdExpenseId = res.body.data.id;
    });

    it('Category 1: Happy Path - manager approval step should transition expense to APPROVED', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/fees/expenses/${createdExpenseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: ExpenseStatusEnum.APPROVED,
          notes: 'Approved by Administrator',
        })
        .expect(201);

      expect(res.body.data.status).toBe(ExpenseStatusEnum.APPROVED);
    });

    it('Category 1: Financial Summary Analytics - should return dashboard metrics', async () => {
      const res = await request(server)
        .get('/api/v1/admin/fees/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalRevenueCollected).toBeDefined();
      expect(res.body.data.totalApprovedExpenses).toBeDefined();
      expect(res.body.data.netOperatingBalance).toBeDefined();
    });
  });
});
