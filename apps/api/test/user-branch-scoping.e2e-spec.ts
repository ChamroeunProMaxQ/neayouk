import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('User Branch Scoping & Isolation (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let superAdminToken: string;
  let branch1AdminToken: string;
  let branch2AdminToken: string;
  let branch1UserId: number;
  let branch2Id: number;

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

    // 1. Provision a second branch (Branch 2) via SuperAdmin
    const branch2Res = await request(server)
      .post('/api/v1/superadmin/branches')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        branchName: 'West Campus',
        code: 'WEST',
        adminUsername: 'west_admin',
        adminPassword: 'password123',
        adminName: 'West Admin',
      })
      .expect(201);

    branch2Id = branch2Res.body.data.branch.id;

    // Tokens for Branch 1 Admin and Branch 2 Admin
    branch1AdminToken = ctx.createToken({
      sub: 10,
      username: 'branch1_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });

    branch2AdminToken = ctx.createToken({
      sub: branch2Res.body.data.adminUser.id,
      username: 'west_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: branch2Id,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  it('Branch 1 Admin creates a user -> user is automatically scoped to branchId 1', async () => {
    const res = await request(server)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        username: 'branch1_teacher',
        password: 'password123',
      })
      .expect(201);

    expect(res.body.data.username).toBe('branch1_teacher');
    expect(res.body.data.branchId).toBe(1);
    branch1UserId = res.body.data.id;
  });

  it('Branch 1 Admin attempting to specify another branchId is overridden to creator branch', async () => {
    const res = await request(server)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        username: 'branch1_override_attempt',
        password: 'password123',
        branchId: branch2Id,
      })
      .expect(201);

    expect(res.body.data.username).toBe('branch1_override_attempt');
    expect(res.body.data.branchId).toBe(1);
  });

  it('Branch 1 Admin can update user in branch 1', async () => {
    const res = await request(server)
      .patch(`/api/v1/admin/users/${branch1UserId}`)
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        username: 'branch1_updated_name',
      })
      .expect(200);

    expect(res.body.data.username).toBe('branch1_updated_name');
    expect(res.body.data.branchId).toBe(1);
  });

  it('SuperAdmin can explicitly assign user to any branch or global', async () => {
    const resBranch2 = await request(server)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: 'super_assigned_branch2',
        password: 'password123',
        branchId: branch2Id,
      })
      .expect(201);

    expect(resBranch2.body.data.branchId).toBe(branch2Id);

    const resGlobal = await request(server)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        username: 'super_assigned_global',
        password: 'password123',
        branchId: null,
      })
      .expect(201);

    expect(resGlobal.body.data.branchId).toBeNull();
  });

  it('Branch 1 Admin only sees users from branch 1', async () => {
    const res = await request(server)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    for (const user of res.body.data) {
      expect(user.branchId).toBe(1);
    }
  });

  it('Branch 2 Admin attempting to read Branch 1 user receives 403 Forbidden', async () => {
    await request(server)
      .get(`/api/v1/admin/users/${branch1UserId}`)
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(403);
  });

  it('Branch 2 Admin attempting to update Branch 1 user receives 403 Forbidden', async () => {
    await request(server)
      .patch(`/api/v1/admin/users/${branch1UserId}`)
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .send({ username: 'hacked_name' })
      .expect(403);
  });

  it('SuperAdmin can view all users regardless of branch', async () => {
    const res = await request(server)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    const branchIds = res.body.data.map((u: any) => u.branchId);
    expect(branchIds).toContain(1);
    expect(branchIds).toContain(branch2Id);
  });
});
