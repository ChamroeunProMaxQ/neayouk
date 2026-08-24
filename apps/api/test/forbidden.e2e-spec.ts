import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupE2eApp,
  teardownE2eApp,
  type E2eTestContext,
} from './utils/e2e-test.utils.js';

describe('Forbidden Requests (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let createToken: E2eTestContext['createToken'];

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    createToken = ctx.createToken;
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  describe('POST /api/v1/admin/users (Forbidden for CUSTOMER)', () => {
    it('should return 403 formatted response when customer attempts to create user', async () => {
      const customerToken = createToken({
        sub: 1,
        username: 'customer1',
        type: UserTypeEnum.CUSTOMER,
      });

      const response = await request(server)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          username: 'unauthorized_new_user',
          password: 'password123',
        })
        .expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'Forbidden resource',
        data: null,
      });
    });
  });

  describe('GET /api/v1/admin/users/:id (Forbidden for other CUSTOMER profile)', () => {
    it('should return 403 formatted response when customer accesses another profile', async () => {
      const customerToken = createToken({
        sub: 1,
        username: 'customer1',
        type: UserTypeEnum.CUSTOMER,
      });

      const response = await request(server)
        .get('/api/v1/admin/users/2')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'Forbidden resource',
        data: null,
      });
    });
  });
});
