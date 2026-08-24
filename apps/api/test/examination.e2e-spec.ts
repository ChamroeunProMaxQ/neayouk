import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum, DefaultGradingComponents, DefaultGradeScale } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminExaminationController & AdminGradingRuleController (e2e)', () => {
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

  let testClassId: number;
  let testStudentId: number;
  let createdRuleId: number;

  beforeAll(async () => {
    // 1. Fetch classes
    const classRes = await request(server)
      .get('/api/v1/admin/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const classList = classRes.body.data?.data || classRes.body.data || [];
    
    // Find class with enrolled students in matrix
    for (const cls of classList) {
      const matrixRes = await request(server)
        .get(`/api/v1/admin/examinations/matrix?classId=${cls.id}&month=2026-08`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      const m = matrixRes.body.data || matrixRes.body;
      if (m?.rows?.length > 0) {
        testClassId = cls.id;
        testStudentId = m.rows[0].studentId;
        break;
      }
    }

    if (!testClassId && classList.length > 0) {
      testClassId = classList[0].id;
    }
  });

  // 1. Happy Path
  describe('1. Happy Path (200/201 Success)', () => {
    it('GET /api/v1/admin/examinations/rules/default - should get active default grading rule', async () => {
      const res = await request(server)
        .get('/api/v1/admin/examinations/rules/default')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toBeDefined();
      expect(data.code).toBeDefined();
      expect(data.components).toBeDefined();
    });

    it('POST /api/v1/admin/examinations/rules - should create custom grading rule', async () => {
      const customCode = `RULE-E2E-${Date.now()}`;
      const res = await request(server)
        .post('/api/v1/admin/examinations/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Grading Scheme',
          code: customCode,
          components: DefaultGradingComponents,
          gradeScale: DefaultGradeScale,
          isDefault: false,
          status: 'ACTIVE',
        })
        .expect(201);

      const data = res.body.data || res.body;
      expect(data.code).toBe(customCode);
      createdRuleId = data.id;
    });

    it('GET /api/v1/admin/examinations/matrix - should fetch gradebook matrix for class and month', async () => {
      if (!testClassId) return;

      const res = await request(server)
        .get(`/api/v1/admin/examinations/matrix?classId=${testClassId}&month=2026-08`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const matrix = res.body.data || res.body;
      expect(matrix.classId).toBe(testClassId);
      expect(matrix.month).toBe('2026-08');
      expect(matrix.rows).toBeInstanceOf(Array);
      expect(matrix.classStats).toBeDefined();
    });

    it('POST /api/v1/admin/examinations/matrix/save - should save student scores in batch', async () => {
      if (!testClassId || !testStudentId) return;

      const res = await request(server)
        .post('/api/v1/admin/examinations/matrix/save')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: testClassId,
          month: '2026-08',
          scores: [
            {
              studentId: testStudentId,
              scores: {
                reading: 9,
                vocab: 27,
                grammar: 18,
                listening: 18,
                speaking: 9,
                homework: 9,
              },
              feedback: 'Great improvement in English skills.',
            },
          ],
        })
        .expect(201);

      const matrix = res.body.data || res.body;
      expect(matrix.classId).toBe(testClassId);
      const studentRow = matrix.rows.find((r: any) => r.studentId === testStudentId);
      expect(studentRow).toBeDefined();
      expect(studentRow.percentage).toBeGreaterThan(0);
      expect(studentRow.gradeLetter).toBeDefined();
    });

    it('GET /api/v1/admin/examinations/report-card/:studentId - should return student report card', async () => {
      if (!testStudentId) return;

      const res = await request(server)
        .get(`/api/v1/admin/examinations/report-card/${testStudentId}?month=2026-08&classId=${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const report = res.body.data || res.body;
      expect(report.studentId).toBe(testStudentId);
      expect(report.month).toBe('2026-08');
      expect(report.components).toBeInstanceOf(Array);
      expect(report.percentage).toBeDefined();
    });

    it('GET /api/v1/admin/examinations/matrix/export - should export CSV file', async () => {
      if (!testClassId) return;

      const res = await request(server)
        .get(`/api/v1/admin/examinations/matrix/export?classId=${testClassId}&month=2026-08`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Student ID');
    });
  });

  // 2. Validation Failures (400 Bad Request)
  describe('2. Validation Failures (400 Bad Request)', () => {
    it('should reject invalid month regex format', async () => {
      await request(server)
        .get(`/api/v1/admin/examinations/matrix?classId=1&month=invalid-month`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should reject grading rule with weights not summing to 100%', async () => {
      await request(server)
        .post('/api/v1/admin/examinations/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Rule',
          code: 'RULE-BAD-WEIGHT',
          components: [{ id: 'test', name: 'Test', maxScore: 50, weight: 50 }],
          gradeScale: DefaultGradeScale,
        })
        .expect(400);
    });

    it('should reject raw score exceeding component maxScore', async () => {
      if (!testClassId || !testStudentId) return;

      await request(server)
        .post('/api/v1/admin/examinations/matrix/save')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: testClassId,
          month: '2026-08',
          scores: [
            {
              studentId: testStudentId,
              scores: { reading: 999 }, // Exceeds maxScore of 10
            },
          ],
        })
        .expect(400);
    });
  });

  // 3. Duplicate Conflict (409)
  describe('3. Duplicate Conflicts (409 Conflict)', () => {
    it('should reject creating rule with existing code', async () => {
      await request(server)
        .post('/api/v1/admin/examinations/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Default',
          code: 'RULE-DEFAULT',
          components: DefaultGradingComponents,
          gradeScale: DefaultGradeScale,
        })
        .expect(409);
    });
  });

  // 4. Resource Not Found (404)
  describe('4. Resource Not Found (404)', () => {
    it('should return 404 for non-existent class ID', async () => {
      await request(server)
        .get('/api/v1/admin/examinations/matrix?classId=999999&month=2026-08')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent grading rule ID', async () => {
      await request(server)
        .get('/api/v1/admin/examinations/rules/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // 5. Auth (401)
  describe('5. Authentication (401 Unauthorized)', () => {
    it('should reject unauthenticated requests', async () => {
      await request(server)
        .get('/api/v1/admin/examinations/matrix?classId=1&month=2026-08')
        .expect(401);
    });
  });
});
