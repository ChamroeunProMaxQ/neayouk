import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const ctx = await setupE2eApp({ globalPrefix: false, version: false });
    app = ctx.app;
    server = ctx.server;
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  let accessToken: string;
  let refreshToken: string;
  const user = {
    username: 'string',
    password: 'string',
  };

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send(user)
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });
  });

  describe('GET /auth/profile', () => {
    it('should return current user', async () => {
      const response = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        username: 'string',
        sub: 11,
      });
    });

    it('should reject without token', async () => {
      await request(server).get('/auth/profile').expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const response = await request(server)
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken,
        })
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toEqual({
        message: 'success',
        status: 201,
      });
    });
  });
});
