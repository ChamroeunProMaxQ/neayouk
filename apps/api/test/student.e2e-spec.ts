import type { INestApplication } from '@nestjs/common';
import {
  UserTypeEnum,
  SemesterEnum,
  PaymentStatusEnum,
  ClassEnrollmentStatusEnum,
} from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminStudentController and AdminClassController (e2e)', () => {
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

  let createdClassId: number;
  let nextClassId: number;
  let createdStudentId: number;

  describe('/api/v1/admin/classes (CRUD)', () => {
    it('should create an academic class', async () => {
      const res = await request(server)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grade 10 - Section A',
          code: 'G10-A',
          gradeLevel: '10',
          program: 'General Education',
          section: 'Room 101',
          monthlyFee: 50.0,
          academicYear: '2025-2026',
          semester: SemesterEnum.SEMESTER_1,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Grade 10 - Section A');
      expect(Number(res.body.data.monthlyFee)).toBe(50.0);
      createdClassId = res.body.data.id;
    });

    it('should create the next semester class for progression testing', async () => {
      const res = await request(server)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grade 10 - Section A (Sem 2)',
          code: 'G10-A-S2',
          gradeLevel: '10',
          program: 'General Education',
          section: 'Room 101',
          monthlyFee: 55.0,
          academicYear: '2025-2026',
          semester: SemesterEnum.SEMESTER_2,
        })
        .expect(201);

      nextClassId = res.body.data.id;
    });

    it('should list classes', async () => {
      const res = await request(server)
        .get('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('/api/v1/admin/students (CRUD & Multi-Class)', () => {
    it('should create a student with Khmer name, discount, and initial class', async () => {
      const res = await request(server)
        .post('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Sokha',
          lastName: 'Chan',
          firstNameKm: 'សុខា',
          lastNameKm: 'ចាន់',
          gender: 'MALE',
          contact: '012345678',
          guardianName: 'Dara Chan',
          guardianPhone: '098765432',
          payableDate: 5,
          discount: 10.0,
          classIds: [createdClassId],
          primaryClassId: createdClassId,
          registeredAt: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString(),
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.firstName).toBe('Sokha');
      expect(res.body.data.firstNameKm).toBe('សុខា');
      expect(Number(res.body.data.discount)).toBe(10.0);
      expect(res.body.data.primaryClass?.id).toBe(createdClassId);
      createdStudentId = res.body.data.id;
    });

    it('should get student details with calculated payment summary', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdStudentId);
      expect(res.body.data.paymentSummary).toBeDefined();
      // Should have unpaid months because student registered 2 months ago and has not paid yet
      expect(res.body.data.paymentSummary.totalUnpaidMonths).toBeGreaterThanOrEqual(2);
      expect(res.body.data.paymentSummary.totalOutstandingAmount).toBeGreaterThan(0);
    });

    it('should update student profile', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          contact: '011223344',
          discount: 15.0,
        })
        .expect(200);

      expect(res.body.data.contact).toBe('011223344');
      expect(Number(res.body.data.discount)).toBe(15.0);
    });
  });

  describe('Monthly Fee Payment & Remaining Unpaid Months Tracking', () => {
    it('should record a monthly fee payment and update unpaid balance', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Record payment for current month
      const payRes = await request(server)
        .post(`/api/v1/admin/students/${createdStudentId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: createdStudentId,
          billingYear: currentYear,
          billingMonth: currentMonth,
          amountPaid: 35.0, // Fee 50 - discount 15 = 35
          paymentMethod: 'KHQR',
          receiptNumber: 'REC-2026-0001',
          notes: 'Paid via KHQR Bakong',
        })
        .expect(201);

      expect(payRes.body.data.status).toBe(PaymentStatusEnum.PAID);

      // Verify updated summary reflects payment
      const summaryRes = await request(server)
        .get(`/api/v1/admin/students/${createdStudentId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(summaryRes.body.data.totalPaidAmount).toBeGreaterThanOrEqual(35.0);
      // Current month should NOT be in the unpaid list now
      const isCurrentMonthUnpaid = summaryRes.body.data.unpaidMonthsList.some(
        (m: any) => m.year === currentYear && m.month === currentMonth,
      );
      expect(isCurrentMonthUnpaid).toBe(false);
    });
  });

  describe('Semester Progression & Class Promotion', () => {
    it('should promote student to next semester class', async () => {
      const promoteRes = await request(server)
        .post(`/api/v1/admin/students/${createdStudentId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: createdStudentId,
          fromClassId: createdClassId,
          toClassId: nextClassId,
          academicYear: '2025-2026',
          semester: SemesterEnum.SEMESTER_2,
          completePreviousEnrollment: true,
          remarks: 'Successfully passed Semester 1 exams',
        })
        .expect(201);

      expect(promoteRes.body.data).toBeDefined();
      expect(promoteRes.body.data.primaryClass?.id).toBe(nextClassId);

      // Check enrollment history shows previous class COMPLETED and new class ENROLLED
      const prevEnrollment = promoteRes.body.data.enrollments.find(
        (e: any) => e.classId === createdClassId,
      );
      const newEnrollment = promoteRes.body.data.enrollments.find(
        (e: any) => e.classId === nextClassId,
      );

      expect(prevEnrollment.status).toBe(ClassEnrollmentStatusEnum.COMPLETED);
      expect(newEnrollment.status).toBe(ClassEnrollmentStatusEnum.ENROLLED);
    });
  });

  describe('Student Soft Delete', () => {
    it('should soft delete student and exclude from default list', async () => {
      await request(server)
        .delete(`/api/v1/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Default list should not include deleted student
      const listRes = await request(server)
        .get('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Sokha' })
        .expect(200);

      expect(listRes.body.data.some((s: any) => s.id === createdStudentId)).toBe(false);

      // Query with onlyDeleted should find deleted student
      const deletedRes = await request(server)
        .get('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Sokha', onlyDeleted: true })
        .expect(200);

      expect(deletedRes.body.data.some((s: any) => s.id === createdStudentId)).toBe(true);
    });
  });
});
