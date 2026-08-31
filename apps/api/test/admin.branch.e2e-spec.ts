import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminBranchController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let superAdminToken: string;
  let branch1AdminToken: string;
  let branch2AdminToken: string;
  let globalUserToken: string;
  let branch2Id: number;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;

    // 1. SuperAdmin Token
    superAdminToken = ctx.createToken({
      sub: 1,
      username: 'superadmin',
      type: UserTypeEnum.SUPER_ADMIN,
      userType: UserTypeEnum.SUPER_ADMIN,
      branchId: null,
    });

    // 2. Provision Branch 2 via SuperAdmin endpoint
    const branch2Res = await request(server)
      .post('/api/v1/superadmin/branches')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        branchName: 'East Campus',
        code: 'EAST',
        address: 'Building 12, East Road',
        phone: '+85511223344',
        email: 'east@institution.edu.kh',
        adminUsername: 'east_branch_admin',
        adminPassword: 'password123',
        adminName: 'East Branch Admin',
      })
      .expect(201);

    branch2Id = branch2Res.body.data.branch.id;

    // 3. Branch 1 Admin Token
    branch1AdminToken = ctx.createToken({
      sub: 10,
      username: 'branch1_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });

    // 4. Branch 2 Admin Token
    branch2AdminToken = ctx.createToken({
      sub: branch2Res.body.data.adminUser.id,
      username: 'east_branch_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: branch2Id,
    });

    // 5. User without branch assigned
    globalUserToken = ctx.createToken({
      sub: 99,
      username: 'unassigned_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: null,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  // -------------------------------------------------------------
  // 1. HAPPY PATH (200 Success)
  // -------------------------------------------------------------
  describe('1. Happy Path', () => {
    it('Branch 1 Admin: GET /api/v1/admin/branches returns only assigned branch (Branch 1)', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(1);
    });

    it('Branch 2 Admin: GET /api/v1/admin/branches returns only assigned branch (Branch 2)', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(branch2Id);
      expect(res.body.data[0].code).toBe('EAST');
    });

    it('Branch 1 Admin: GET /api/v1/admin/branches/current returns current assigned branch', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches/current')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(1);
    });

    it('Branch 2 Admin: GET /api/v1/admin/branches/current returns current assigned branch', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches/current')
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(branch2Id);
      expect(res.body.data.code).toBe('EAST');
    });

    it('Branch 1 Admin: GET /api/v1/admin/branches/1 reads own branch by ID', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(1);
    });

    it('Branch 1 Admin: PATCH /api/v1/admin/branches/current updates own branch details', async () => {
      const res = await request(server)
        .patch('/api/v1/admin/branches/current')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .send({
          address: 'Updated Main Campus Address',
          phone: '+85599887766',
        })
        .expect(200);

      expect(res.body.data.id).toBe(1);
      expect(res.body.data.address).toBe('Updated Main Campus Address');
      expect(res.body.data.phone).toBe('+85599887766');
    });

    it('Branch 1 Admin: PATCH /api/v1/admin/branches/1 updates own branch by ID', async () => {
      const res = await request(server)
        .patch('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .send({
          name: 'Main Campus Prime',
        })
        .expect(200);

      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBe('Main Campus Prime');
    });

    it('SuperAdmin: GET /api/v1/admin/branches lists all branches across institution', async () => {
      const res = await request(server)
        .get('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      const ids = res.body.data.map((b: any) => b.id);
      expect(ids).toContain(1);
      expect(ids).toContain(branch2Id);
    });

    it('SuperAdmin: GET /api/v1/admin/branches/:id reads any branch by ID', async () => {
      const resB1 = await request(server)
        .get('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      expect(resB1.body.data.id).toBe(1);

      const resB2 = await request(server)
        .get(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      expect(resB2.body.data.id).toBe(branch2Id);
    });

    it('SuperAdmin: PATCH /api/v1/admin/branches/:id updates any branch', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'East Campus International',
        })
        .expect(200);

      expect(res.body.data.name).toBe('East Campus International');
    });
  });

  // -------------------------------------------------------------
  // 2. VALIDATION FAILURES (400 Bad Request)
  // -------------------------------------------------------------
  describe('2. Validation Failures (400 Bad Request)', () => {
    it('should reject invalid email format with 400 Bad Request', async () => {
      await request(server)
        .patch('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .send({
          email: 'invalid-email-format',
        })
        .expect(400);
    });

    it('should reject invalid non-numeric ID parameter with 400 Bad Request', async () => {
      await request(server)
        .get('/api/v1/admin/branches/invalid-id')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .expect(400);
    });
  });

  // -------------------------------------------------------------
  // 3. CONFLICT FAILURES (409 Conflict)
  // -------------------------------------------------------------
  describe('3. Duplicate & Uniqueness Conflicts (409 Conflict)', () => {
    it('should reject updating code to an existing branch code with 409 Conflict', async () => {
      await request(server)
        .patch('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .send({
          code: 'EAST', // already belongs to Branch 2
        })
        .expect(409);
    });
  });

  // -------------------------------------------------------------
  // 4. RESOURCE NOT FOUND (404 Not Found)
  // -------------------------------------------------------------
  describe('4. Resource Not Found (404 Not Found)', () => {
    it('should return 404 when querying non-existent branch ID', async () => {
      await request(server)
        .get('/api/v1/admin/branches/99999')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    it('should return 404 when SuperAdmin without assigned branch calls /current', async () => {
      await request(server)
        .get('/api/v1/admin/branches/current')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });

  // -------------------------------------------------------------
  // 5. AUTHENTICATION & AUTHORIZATION GUARDS (401 / 403)
  // -------------------------------------------------------------
  describe('5. Authentication & Authorization Guards (401 / 403)', () => {
    it('should reject unassigned admin user calling /current with 403 Forbidden', async () => {
      await request(server)
        .get('/api/v1/admin/branches/current')
        .set('Authorization', `Bearer ${globalUserToken}`)
        .expect(403);
    });
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      await request(server)
        .get('/api/v1/admin/branches')
        .expect(401);
    });

    it('Branch 2 Admin attempting to read Branch 1 receives 403 Forbidden', async () => {
      await request(server)
        .get('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .expect(403);
    });

    it('Branch 2 Admin attempting to update Branch 1 receives 403 Forbidden', async () => {
      await request(server)
        .patch('/api/v1/admin/branches/1')
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .send({ name: 'Hacked Branch Name' })
        .expect(403);
    });

    it('Branch 1 Admin attempting to read Branch 2 receives 403 Forbidden', async () => {
      await request(server)
        .get(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .expect(403);
    });

    it('Branch 1 Admin attempting to update Branch 2 receives 403 Forbidden', async () => {
      await request(server)
        .patch(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${branch1AdminToken}`)
        .send({ name: 'Hacked East Campus' })
        .expect(403);
    });
  });

  // -------------------------------------------------------------
  // 6. EDGE & BOUNDARY LIMITS
  // -------------------------------------------------------------
  describe('6. Edge & Boundary Limits', () => {
    it('should normalize code to uppercase on update', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .send({ code: 'east-new' })
        .expect(200);

      expect(res.body.data.code).toBe('EAST-NEW');
    });

    it('should allow clearing optional fields to null or empty string', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/branches/${branch2Id}`)
        .set('Authorization', `Bearer ${branch2AdminToken}`)
        .send({
          email: '',
          phone: '',
          address: '',
        })
        .expect(200);

      expect(res.body.data.email).toBeNull();
      expect(res.body.data.phone).toBeNull();
      expect(res.body.data.address).toBeNull();
    });
  });
});
