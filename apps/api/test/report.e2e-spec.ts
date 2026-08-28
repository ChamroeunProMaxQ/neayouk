import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum, ReportDatePresetEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('Report and Analytics Module (e2e - All 6 Condition Categories)', () => {
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
      sub: 2,
      username: 'customer',
      type: UserTypeEnum.CUSTOMER,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  // -------------------------------------------------------------------------
  // Category 5: Authentication & Authorization Guards (401 / 403)
  // -------------------------------------------------------------------------
  describe('Category 5: Authentication & Authorization Guards', () => {
    it('should return 401 Unauthorized when accessing overview without token', async () => {
      await request(server).get('/api/v1/admin/reports/overview').expect(401);
    });

    it('should return 401 Unauthorized when accessing financial summary without token', async () => {
      await request(server).get('/api/v1/admin/reports/financial/summary').expect(401);
    });

    it('should return 403 Forbidden when accessing reports as customer', async () => {
      await request(server)
        .get('/api/v1/admin/reports/overview')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  // Category 1: Happy Path (200 Success)
  // -------------------------------------------------------------------------
  describe('Category 1: Happy Path', () => {
    it('should fetch report overview hub metrics', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.financial).toBeDefined();
      expect(res.body.data.academic).toBeDefined();
      expect(res.body.data.attendance).toBeDefined();
    });

    it('should fetch financial summary with date presets', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/reports/financial/summary?preset=${ReportDatePresetEnum.THIS_MONTH}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalRevenue).toBeDefined();
      expect(res.body.data.totalExpenses).toBeDefined();
      expect(res.body.data.netOperatingMargin).toBeDefined();
      expect(Array.isArray(res.body.data.monthlyTrends)).toBe(true);
      expect(Array.isArray(res.body.data.revenueByCategory)).toBe(true);
    });

    it('should export financial CSV stream', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(typeof res.text).toBe('string');
      expect(res.text).toContain('Transaction Type');
    });

    it('should fetch academic summary report', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/academic/summary?academicYear=2025-2026')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalStudentsAssessed).toBeDefined();
      expect(res.body.data.overallAverageScore).toBeDefined();
      expect(Array.isArray(res.body.data.gradeDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.subjectMastery)).toBe(true);
    });

    it('should export academic CSV stream', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/academic/export?academicYear=2025-2026')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Student Code');
    });

    it('should fetch attendance summary report', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/reports/attendance/summary?preset=${ReportDatePresetEnum.THIS_MONTH}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.studentAttendanceRate).toBeDefined();
      expect(res.body.data.teacherAttendanceRate).toBeDefined();
      expect(Array.isArray(res.body.data.dailyTrends)).toBe(true);
      expect(Array.isArray(res.body.data.weekdayAbsencePatterns)).toBe(true);
    });

    it('should export attendance CSV stream', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/attendance/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Student Code');
    });
  });

  // -------------------------------------------------------------------------
  // Category 2: Validation Failures (400 Bad Request)
  // -------------------------------------------------------------------------
  describe('Category 2: Validation Failures', () => {
    it('should return 400 Bad Request on invalid preset enum', async () => {
      await request(server)
        .get('/api/v1/admin/reports/financial/summary?preset=INVALID_PRESET')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request on non-numeric classId filter', async () => {
      await request(server)
        .get('/api/v1/admin/reports/academic/summary?classId=not-a-number')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // -------------------------------------------------------------------------
  // Category 4: Resource Not Found & Empty Boundaries (200 with Empty Collections)
  // -------------------------------------------------------------------------
  describe('Category 4: Empty Boundaries & Non-Existent Filters', () => {
    it('should return graceful 0-aggregated metrics for non-existent classId', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/academic/summary?classId=999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalStudentsAssessed).toBe(0);
      expect(res.body.data.overallAverageScore).toBe(0);
      expect(res.body.data.topPerformers).toEqual([]);
      expect(res.body.data.atRiskStudents).toEqual([]);
    });

    it('should return empty attendance summary for non-existent classId', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/attendance/summary?classId=999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalSessionsRecorded).toBe(0);
      expect(res.body.data.chronicAbsenteeismList).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Category 6: Edge & Boundary Limits
  // -------------------------------------------------------------------------
  describe('Category 6: Edge & Boundary Limits', () => {
    it('should handle custom date range spanning multiple years gracefully', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/financial/summary?startDate=2020-01-01&endDate=2030-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalRevenue).toBeDefined();
      expect(res.body.data.netOperatingMargin).toBeDefined();
    });

    it('should handle single-day custom date range', async () => {
      const res = await request(server)
        .get('/api/v1/admin/reports/attendance/summary?startDate=2026-02-15&endDate=2026-02-15')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.studentAttendanceRate).toBeDefined();
    });
  });
});
