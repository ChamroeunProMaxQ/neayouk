import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminSettingController - School Profile & Logo (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let branch1AdminToken: string;
  let branch2AdminToken: string;
  let unassignedUserToken: string;
  let customerToken: string;
  let branch2Id: number;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;

    const superAdminToken = ctx.createToken({
      sub: 1,
      username: 'superadmin',
      type: UserTypeEnum.SUPER_ADMIN,
      userType: UserTypeEnum.SUPER_ADMIN,
      branchId: null,
    });

    // Create Branch 2 to test branch isolation and code conflict
    const branch2Res = await request(server)
      .post('/api/v1/superadmin/branches')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        branchName: 'North Campus',
        code: 'NORTH',
        address: 'St. 598, Phnom Penh',
        phone: '023 111 222',
        email: 'north@neayouk.edu.kh',
        adminUsername: 'north_admin',
        adminPassword: 'password123',
        adminName: 'North Admin',
      });

    branch2Id = branch2Res.body.data.branch.id;

    branch1AdminToken = ctx.createToken({
      sub: 10,
      username: 'branch1_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });

    branch2AdminToken = ctx.createToken({
      sub: 20,
      username: 'branch2_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: branch2Id,
    });

    unassignedUserToken = ctx.createToken({
      sub: 99,
      username: 'unassigned_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: null,
    });

    customerToken = ctx.createToken({
      sub: 100,
      username: 'portal_customer',
      type: UserTypeEnum.PORTAL_USER,
      userType: UserTypeEnum.PORTAL_USER,
      branchId: 1,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  // 1. Happy Path
  it('GET /api/v1/admin/settings/profile - returns current branch school profile', async () => {
    const res = await request(server)
      .get('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.code).toBe('MAIN');
  });

  it('PATCH /api/v1/admin/settings/profile - updates school details, Khmer name, and receipt terms', async () => {
    const updatePayload = {
      name: 'Neayouk International Academy',
      nameKhmer: 'សាលាអន្តរជាតិ នាយក',
      phone: '023 777 888',
      email: 'contact@neayouk.edu.kh',
      website: 'https://neayouk.edu.kh',
      motto: 'Leadership & Innovation',
      receiptFooterTerms: '1. All payments are strictly non-refundable.\n2. Please keep your receipt safe.',
      receiptSignatureTitle: 'Head of Finance',
    };

    const res = await request(server)
      .patch('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send(updatePayload)
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data.name).toBe('Neayouk International Academy');
    expect(res.body.data.nameKhmer).toBe('សាលាអន្តរជាតិ នាយក');
    expect(res.body.data.motto).toBe('Leadership & Innovation');
    expect(res.body.data.receiptFooterTerms).toBe(updatePayload.receiptFooterTerms);
    expect(res.body.data.receiptSignatureTitle).toBe('Head of Finance');
  });

  it('POST /api/v1/admin/settings/logo - uploads logo file and updates logoUrl', async () => {
    const dummyImageBuffer = Buffer.from('fake-png-content-for-testing');

    const res = await request(server)
      .post('/api/v1/admin/settings/logo')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .attach('logo', dummyImageBuffer, 'school-logo.png')
      .expect(201);

    expect(res.body.status).toBe(201);
    expect(res.body.data.logoUrl).toBeDefined();
    expect(res.body.data.logoUrl).toContain('/uploads/logos/branch-1-');
  });

  it('DELETE /api/v1/admin/settings/logo - removes logo and reverts logoUrl to null', async () => {
    const res = await request(server)
      .delete('/api/v1/admin/settings/logo')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data.logoUrl).toBeNull();
  });

  // 2. Validation Failures (400)
  it('PATCH /api/v1/admin/settings/profile - fails with 400 when name is empty or email is invalid', async () => {
    const res = await request(server)
      .patch('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: '',
        email: 'invalid-email-format',
      })
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  it('POST /api/v1/admin/settings/logo - fails with 400 when file is missing', async () => {
    const res = await request(server)
      .post('/api/v1/admin/settings/logo')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({})
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  // 3. Duplicate / Conflict (409)
  it('PATCH /api/v1/admin/settings/profile - fails with 409 when branch code already exists', async () => {
    const res = await request(server)
      .patch('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: 'Main Campus',
        code: 'NORTH', // NORTH belongs to Branch 2
      })
      .expect(409);

    expect(res.body.status).toBe(409);
  });

  // 4. Guard blocked (403) when user has no assigned branch
  it('GET /api/v1/admin/settings/profile - fails with 403 when user has no assigned branch', async () => {
    const res = await request(server)
      .get('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${unassignedUserToken}`)
      .expect(403);

    expect(res.body.status).toBe(403);
  });

  // 5. Auth & Guard (401 & 403)
  it('GET /api/v1/admin/settings/profile - fails with 401 without JWT', async () => {
    await request(server)
      .get('/api/v1/admin/settings/profile')
      .expect(401);
  });

  it('GET /api/v1/admin/settings/profile - fails with 403 for portal customer user', async () => {
    await request(server)
      .get('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  // 6. Branch Scoping Isolation
  it('Verifies Branch 2 cannot see Branch 1 profile modifications', async () => {
    const res = await request(server)
      .get('/api/v1/admin/settings/profile')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    expect(res.body.data.id).toBe(branch2Id);
    expect(res.body.data.code).toBe('NORTH');
    expect(res.body.data.name).toBe('North Campus');
  });
});
