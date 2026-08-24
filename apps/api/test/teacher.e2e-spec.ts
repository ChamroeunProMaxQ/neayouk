import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum, TeacherGenderEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminTeacherController (e2e)', () => {
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

  let createdTeacherId: number;
  let testClassId: number;
  let teacherToken: string;
  const uniqueSuffix = Date.now().toString().slice(-4);
  const teacherUsername = `teacher_e2e_${uniqueSuffix}`;

  describe('Teacher CRUD operations', () => {
    it('POST /api/v1/admin/teachers - should create a teacher with user login account', async () => {
      const res = await request(server)
        .post('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sarah Connor',
          nameKm: 'សារ៉ា កូណ័រ',
          teacherCode: `TCH-E2E-${uniqueSuffix}`,
          gender: TeacherGenderEnum.FEMALE,
          salaryInHour: 25.0,
          phone: '012999888',
          email: `sarah_${uniqueSuffix}@school.edu.kh`,
          specialization: 'Physics & STEM',
          bio: 'Senior Physics educator.',
          createAccount: true,
          username: teacherUsername,
          password: 'TeacherPass123!',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Sarah Connor');
      expect(res.body.data.salaryInHour).toBe(25);
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe(teacherUsername);
      createdTeacherId = res.body.data.id;
    });

    it('POST /api/v1/auth/login - should allow newly created teacher to log in', async () => {
      const loginRes = await request(server)
        .post('/api/v1/auth/login')
        .send({
          username: teacherUsername,
          password: 'TeacherPass123!',
        })
        .expect(201);

      const token =
        loginRes.body.data?.accessToken || loginRes.body.accessToken;
      expect(token).toBeDefined();
      teacherToken = token;

      // Verify profile
      const profileRes = await request(server)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const profileData = profileRes.body.data || profileRes.body;
      expect(profileData.username).toBe(teacherUsername);
      expect(profileData.userType).toBe(UserTypeEnum.CMS);
    });

    it('RBAC Enforcement: Teacher role can read programs but CANNOT create programs (403 Forbidden)', async () => {
      // 1. Teacher can read programs (200 OK)
      await request(server)
        .get('/api/v1/admin/programs')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // 2. Teacher is blocked with 403 Forbidden when attempting to create a program
      await request(server)
        .post('/api/v1/admin/programs')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: `Unauthorized Program ${uniqueSuffix}`,
          code: `UNAUTH-${uniqueSuffix}`,
        })
        .expect(403);
    });

    it('GET /api/v1/admin/teachers - should list teachers with search and filters', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/teachers?search=Sarah Connor&gender=FEMALE`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(createdTeacherId);
    });

    it('GET /api/v1/admin/teachers/:id - should get teacher details', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdTeacherId);
      expect(res.body.data.name).toBe('Sarah Connor');
      expect(res.body.data.salaryInHour).toBe(25);
    });

    it('PATCH /api/v1/admin/teachers/:id - should update teacher profile and hourly salary', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sarah Connor PhD',
          salaryInHour: 30.0,
          specialization: 'Advanced Quantum Physics',
        })
        .expect(200);

      expect(res.body.data.name).toBe('Sarah Connor PhD');
      expect(res.body.data.salaryInHour).toBe(30);
      expect(res.body.data.specialization).toBe('Advanced Quantum Physics');
    });
  });

  describe('Class assignment to teacher (1:N Teacher to Classes)', () => {
    it('POST /api/v1/admin/classes - should create class assigned to teacher', async () => {
      const res = await request(server)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Physics 101 - Cohort ${uniqueSuffix}`,
          code: `PHY-${uniqueSuffix}`,
          gradeLevel: '11',
          teacherId: createdTeacherId,
          monthlyFee: 80.0,
        })
        .expect(201);

      testClassId = res.body.data.id;
      expect(res.body.data.teacherId).toBe(createdTeacherId);
    });

    it('GET /api/v1/admin/teachers/:id/classes - should return assigned classes for teacher', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/teachers/${createdTeacherId}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.find((c: any) => c.id === testClassId);
      expect(found).toBeDefined();
      expect(found.name).toContain('Physics 101');
    });
  });

  describe('Error handling & guards', () => {
    it('POST /api/v1/admin/teachers - should return 409 Conflict for duplicate teacher code', async () => {
      await request(server)
        .post('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Teacher',
          teacherCode: `TCH-E2E-${uniqueSuffix}`,
        })
        .expect(409);
    });

    it('GET /api/v1/admin/teachers/:id - should return 404 for non-existent teacher', async () => {
      await request(server)
        .get('/api/v1/admin/teachers/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('GET /api/v1/admin/teachers - should return 401 without auth header', async () => {
      await request(server).get('/api/v1/admin/teachers').expect(401);
    });

    it('DELETE /api/v1/admin/teachers/:id - should soft delete teacher', async () => {
      await request(server)
        .delete(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify 404 on subsequent get
      await request(server)
        .get(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
