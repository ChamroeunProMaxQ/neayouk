import { type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserTypeEnum } from '@repo/shared';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ZodValidationPipe } from 'nestjs-zod';
import { migrator, seeder } from '../database/umzug.js';
import { HttpExceptionsFilter } from '../src/common/filter/http-exception.filter.js';
import { AppModule } from '../src/app.module.js';

describe('Forbidden Requests (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await migrator.up();
    await seeder.up();

    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await seeder.down({ to: 0 });
    await migrator.down({ to: 0 });
    await app.close();
  });

  describe('POST /api/v1/users (Forbidden for CUSTOMER)', () => {
    it('should return 403 formatted response when customer attempts to create user', async () => {
      const customerToken = jwtService.sign({
        sub: 1,
        username: 'customer1',
        type: UserTypeEnum.CUSTOMER,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          username: 'unauthorized_new_user',
          password: 'password123',
        })
        .expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'You do not have permission to access or modify this resource',
        data: null,
      });
    });
  });

  describe('GET /api/v1/users/:id (Forbidden for other CUSTOMER profile)', () => {
    it('should return 403 formatted response when customer accesses another profile', async () => {
      // Customer ID 1 attempting to access user ID 2
      const customerToken = jwtService.sign({
        sub: 1,
        username: 'customer1',
        type: UserTypeEnum.CUSTOMER,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/2')
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
