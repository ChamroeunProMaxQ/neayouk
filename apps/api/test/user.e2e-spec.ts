import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';

import { ZodValidationPipe } from 'nestjs-zod';
import { migrator, seeder } from '@database/umzug.js';
import { AppModule } from '@src/app.module.js';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await migrator.up();
    await seeder.up();

    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();
    jwtService = app.get(JwtService);
    adminToken = jwtService.sign({
      sub: 11,
      username: 'string',
      type: UserTypeEnum.ADMIN,
    });
  });

  afterAll(async () => {
    await seeder.down({ to: 0 });
    await migrator.down({ to: 0 });
    await app.close();
  });

  describe('/api/v1/users (POST)', () => {
    it('should create user', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(1);
    });
  });

  describe('/api/v1/users (GET)', () => {
    it('should return users', async () => {
      const response = await request(app.getHttpServer())
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
