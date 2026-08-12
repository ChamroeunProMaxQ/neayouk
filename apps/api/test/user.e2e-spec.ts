import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    adminToken = ctx.createToken({
      sub: 11,
      username: 'string',
      type: UserTypeEnum.ADMIN,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  describe('/api/v1/users (POST)', () => {
    it('should create user', async () => {
      const response = await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'john',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          username: 'john',
        }),
      );
    });

    it('should return empty password', async () => {
      const response = await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'john2',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          password: '',
        }),
      );
    });
  });

  describe('/api/v1/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const response = await request(server)
        .get('/api/v1/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(1);
    });
  });

  describe('/api/v1/users (GET)', () => {
    it('should return users', async () => {
      const response = await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          pageSize: 10,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toHaveLength(10);
    });
  });
});
