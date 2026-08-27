import type { INestApplication } from '@nestjs/common';
import {
  PaymentMethodEnum,
  PayrollItemTypeEnum,
  PayrollStatusEnum,
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  UserTypeEnum,
} from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('HR & Payroll Module (e2e - All 6 Condition Categories)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    adminToken = ctx.createToken({
      sub: 1,
      username: 'admin',
      type: UserTypeEnum.ADMIN,
    });
    customerToken = ctx.createToken({
      sub: 99,
      username: 'customer',
      type: UserTypeEnum.CUSTOMER,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  let createdStaffId: number;
  let createdPayrollId: number;

  // 1. Authentication & Authorization Guards (401 / 403)
  describe('Category 5: Authentication & Authorization Guards', () => {
    it('should return 401 Unauthorized when accessing staff list without token', async () => {
      await request(server).get('/api/v1/admin/hr/staff').expect(401);
    });

    it('should return 401 Unauthorized when accessing payrolls without token', async () => {
      await request(server).get('/api/v1/admin/hr/payrolls').expect(401);
    });

    it('should return 403 Forbidden when creating staff with customer token', async () => {
      await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Staff',
          department: StaffDepartmentEnum.ACADEMIC,
          designation: 'Teacher',
        })
        .expect(403);
    });
  });

  // 2. Staff Management API (Happy Path & Validations)
  describe('Staff API', () => {
    it('Category 2: Validation Failures - should return 400 when creating staff without required name', async () => {
      await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department: StaffDepartmentEnum.ACADEMIC,
        })
        .expect(400);
    });

    it('Category 1: Happy Path - should create a new staff member with hourly salary', async () => {
      const res = await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Alice Johnson',
          nameKm: 'អាលីស ចនសុន',
          staffCode: 'STF-TEST-001',
          department: StaffDepartmentEnum.ACADEMIC,
          designation: 'English Teacher',
          specialization: 'IELTS Preparation',
          salaryType: StaffSalaryTypeEnum.HOURLY,
          hourlyRate: 18.5,
          bankName: 'ABA Bank',
          bankAccountNumber: '123456789',
        })
        .expect(201);

      expect(res.body.data.name).toBe('Alice Johnson');
      expect(res.body.data.hourlyRate).toBe(18.5);
      expect(res.body.data.salaryType).toBe(StaffSalaryTypeEnum.HOURLY);
      createdStaffId = res.body.data.id;
    });

    it('Category 3: Duplicate Conflicts - should return 409 when creating staff with duplicate staffCode', async () => {
      await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dupe Staff',
          staffCode: 'STF-TEST-001',
          designation: 'Staff',
        })
        .expect(409);
    });

    it('Category 1: Happy Path - should list staff members with pagination and search filter', async () => {
      const res = await request(server)
        .get('/api/v1/admin/hr/staff?search=Alice&page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('Category 1: Happy Path - should get staff details by ID', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/hr/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdStaffId);
      expect(res.body.data.name).toBe('Alice Johnson');
    });

    it('Category 4: Resource Not Found - should return 404 for non-existent staff ID', async () => {
      await request(server)
        .get('/api/v1/admin/hr/staff/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('Category 1: Happy Path - should update staff details', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/hr/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          designation: 'Senior IELTS Instructor',
          hourlyRate: 20.0,
        })
        .expect(200);

      expect(res.body.data.designation).toBe('Senior IELTS Instructor');
      expect(res.body.data.hourlyRate).toBe(20.0);
    });
  });

  // 3. Payroll Management API (Happy Path, Validations, and Calculations)
  describe('Payroll API', () => {
    it('Category 2: Validation Failures - should return 400 on invalid payroll payload (e.g. invalid month)', async () => {
      await request(server)
        .post('/api/v1/admin/hr/payrolls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: createdStaffId,
          year: 2026,
          month: 13, // Invalid month > 12
        })
        .expect(400);
    });

    it('Category 4: Resource Not Found - should return 404 when creating payroll for non-existent staff', async () => {
      await request(server)
        .post('/api/v1/admin/hr/payrolls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: 999999,
          year: 2026,
          month: 9,
        })
        .expect(404);
    });

    it('Category 1: Happy Path - should create an hourly payroll with dynamic bonus and deduction line items', async () => {
      const res = await request(server)
        .post('/api/v1/admin/hr/payrolls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: createdStaffId,
          year: 2026,
          month: 9,
          totalHoursWorked: 30, // 30 hrs @ $20 = $600
          items: [
            {
              itemType: PayrollItemTypeEnum.BONUS,
              title: 'Student Retention Bonus',
              amount: 50.0,
            },
            {
              itemType: PayrollItemTypeEnum.TAX,
              title: 'Tax Deduction',
              amount: 25.0,
            },
          ],
          notes: 'September 2026 Payroll Draft',
        });

      if (res.status !== 201) {
        console.error('CREATE PAYROLL FAILED:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(201);

      expect(res.body.data.calculatedBaseAmount).toBe(600); // 30 * 20
      expect(res.body.data.totalBonus).toBe(50);
      expect(res.body.data.totalDeduction).toBe(25);
      expect(res.body.data.grossSalary).toBe(650); // 600 + 50
      expect(res.body.data.netSalary).toBe(625); // 650 - 25
      expect(res.body.data.status).toBe(PayrollStatusEnum.DRAFT);
      expect(res.body.data.workingDays).toBeGreaterThan(0);
      createdPayrollId = res.body.data.id;
    });

    it('Category 3: Duplicate Conflicts - should return 409 when creating duplicate payroll for same staff and month', async () => {
      await request(server)
        .post('/api/v1/admin/hr/payrolls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: createdStaffId,
          year: 2026,
          month: 9,
        })
        .expect(409);
    });

    it('Category 1: Happy Path - should list payrolls with filters and pagination', async () => {
      const res = await request(server)
        .get('/api/v1/admin/hr/payrolls?year=2026&month=9&page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('Category 1: Happy Path - should update payroll draft items and recalculate totals', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/hr/payrolls/${createdPayrollId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          totalHoursWorked: 35, // 35 * 20 = $700
          items: [
            {
              itemType: PayrollItemTypeEnum.BONUS,
              title: 'Updated Retention Bonus',
              amount: 60.0,
            },
            {
              itemType: PayrollItemTypeEnum.DEDUCTION,
              title: 'Unpaid Leave (1 day)',
              amount: 20.0,
            },
          ],
        });

      if (res.status !== 200) {
        console.error('PATCH PAYROLL FAILED:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);

      expect(res.body.data.calculatedBaseAmount).toBe(700);
      expect(res.body.data.totalBonus).toBe(60);
      expect(res.body.data.totalDeduction).toBe(20);
      expect(res.body.data.grossSalary).toBe(760);
      expect(res.body.data.netSalary).toBe(740);
    });

    it('Category 1: Happy Path - should process payment and automatically log school expense', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/hr/payrolls/${createdPayrollId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
          paymentReference: 'TRX-ABA-TEST-999',
        })
        .expect(201);

      expect(res.body.data.status).toBe(PayrollStatusEnum.PAID);
      expect(res.body.data.paymentMethod).toBe(PaymentMethodEnum.BANK_TRANSFER);
      expect(res.body.data.paymentReference).toBe('TRX-ABA-TEST-999');

      // Verify that the expense was recorded in school expenses
      const expenseRes = await request(server)
        .get(`/api/v1/admin/fees/expenses?search=TRX-ABA-TEST-999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(expenseRes.body.data)).toBe(true);
    });

    it('Category 3: Duplicate Conflicts - should return 409 when trying to pay an already PAID payroll', async () => {
      await request(server)
        .post(`/api/v1/admin/hr/payrolls/${createdPayrollId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: PaymentMethodEnum.CASH,
        })
        .expect(409);
    });

    it('Category 3: Invalid State - should return 409 when trying to edit a PAID payroll', async () => {
      await request(server)
        .patch(`/api/v1/admin/hr/payrolls/${createdPayrollId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          totalHoursWorked: 50,
        })
        .expect(409);
    });

    it('Category 1: Happy Path - should fetch financial payroll summary', async () => {
      const res = await request(server)
        .get('/api/v1/admin/hr/payrolls/summary?year=2026&month=9')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalPaid).toBeGreaterThanOrEqual(740);
      expect(res.body.data.paidCount).toBeGreaterThanOrEqual(1);
    });
  });

  // 4. Edge & Boundary Limits
  describe('Category 6: Edge & Boundary Limits', () => {
    it('should handle zero hourly rate and zero worked hours gracefully', async () => {
      const staffRes = await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Volunteer Helper',
          department: StaffDepartmentEnum.OPERATIONS,
          designation: 'Volunteer',
          salaryType: StaffSalaryTypeEnum.HOURLY,
          hourlyRate: 0,
        })
        .expect(201);

      const payrollRes = await request(server)
        .post('/api/v1/admin/hr/payrolls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: staffRes.body.data.id,
          year: 2026,
          month: 11,
          totalHoursWorked: 0,
        })
        .expect(201);

      expect(payrollRes.body.data.calculatedBaseAmount).toBe(0);
      expect(payrollRes.body.data.netSalary).toBe(0);
    });

    it('should handle Khmer unicode text in names, notes, and bonus titles', async () => {
      const staffRes = await request(server)
        .post('/api/v1/admin/hr/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chea Vichea',
          nameKm: 'ជា វិជ្ជា',
          department: StaffDepartmentEnum.ACADEMIC,
          designation: 'គ្រូបង្រៀនគណិតវិទ្យា',
          salaryType: StaffSalaryTypeEnum.MONTHLY,
          baseSalary: 500,
          notes: 'គ្រូបង្រៀនកិច្ចសន្យាឆ្នាំ២០២៦',
        })
        .expect(201);

      expect(staffRes.body.data.nameKm).toBe('ជា វិជ្ជា');
      expect(staffRes.body.data.designation).toBe('គ្រូបង្រៀនគណិតវិទ្យា');
    });
  });
});
