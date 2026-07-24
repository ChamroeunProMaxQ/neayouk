import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ZodValidationPipe } from 'nestjs-zod';
import { migrator, seeder } from '../database/umzug.js';
import { AppModule } from '../src/app.module.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await migrator.up();
    await seeder.up();

    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await seeder.down({ to: 0 });
    await migrator.down({ to: 0 });
    await app.close();
  });

  let accessToken: string;
  let refreshToken: string;
  const user = {
    username: 'string',
    password: 'string',
  };

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        username: 'string',
        sub: 11,
      });
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
