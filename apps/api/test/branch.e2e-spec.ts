import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('SuperAdminBranchController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let superAdminToken: string;
  let branchAdminToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;

    superAdminToken = ctx.createToken({
      sub: 1,
      username: 'superadmin',
      type: UserTypeEnum.SUPER_ADMIN,
      userType: UserTypeEnum.SUPER_ADMIN,
      branchId: null,
    });

    branchAdminToken = ctx.createToken({
      sub: 2,
      username: 'admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  describe('SuperAdmin Provisioning: POST /api/v1/superadmin/branches', () => {
    it('should allow SuperAdmin to provision a new branch with initial Branch Admin', async () => {
      const payload = {
        branchName: 'Sunrise International School',
        code: 'SUNRISE',
        address: 'Building 45, Street 2004, Phnom Penh',
        phone: '+85512345678',
        email: 'info@sunrise.edu.kh',
        adminUsername: 'sunrise_admin',
        adminPassword: 'password123',
        adminName: 'Sunrise Admin',
        adminEmail: 'admin@sunrise.edu.kh',
        adminPhone: '+85512345679',
      };

      const res = await request(server)
        .post('/api/v1/superadmin/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.branch).toMatchObject({
        name: 'Sunrise International School',
        code: 'SUNRISE',
        isDefault: true,
        status: 'ACTIVE',
      });
      expect(res.body.data.adminUser).toMatchObject({
        username: 'sunrise_admin',
        userType: 'ADMIN',
        status: 'ACTIVE',
      });
      expect(res.body.data.adminUser.branchId).toBe(res.body.data.branch.id);
    });

    it('should reject non-superadmin users with 403 Forbidden', async () => {
      await request(server)
        .post('/api/v1/superadmin/branches')
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({
          branchName: 'Unauthorized Branch',
          code: 'UNAUTH',
          adminUsername: 'unauth_admin',
          adminPassword: 'password123',
          adminName: 'Unauth Admin',
        })
        .expect(403);
    });

    it('should reject duplicate branch code with 409 Conflict', async () => {
      await request(server)
        .post('/api/v1/superadmin/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchName: 'Duplicate Branch',
          code: 'SUNRISE',
          adminUsername: 'duplicate_admin',
          adminPassword: 'password123',
          adminName: 'Duplicate Admin',
        })
        .expect(409);
    });
  });

  describe('SuperAdmin Listing & Updates: GET & PATCH /api/v1/superadmin/branches', () => {
    it('should allow SuperAdmin to list all branches', async () => {
      const res = await request(server)
        .get('/api/v1/superadmin/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow SuperAdmin to update branch details', async () => {
      const listRes = await request(server)
        .get('/api/v1/superadmin/branches')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const branch = listRes.body.data[0];

      const updateRes = await request(server)
        .patch(`/api/v1/superadmin/branches/${branch.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Updated Branch Name' })
        .expect(200);

      expect(updateRes.body.data.name).toBe('Updated Branch Name');
    });
  });
});
