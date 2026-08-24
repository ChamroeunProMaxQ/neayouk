import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminUserController (e2e)', () => {
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

  describe('/api/v1/admin/users (POST)', () => {
    it('should create user', async () => {
      const response = await request(server)
        .post('/api/v1/admin/users')
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
        .post('/api/v1/admin/users')
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

  describe('/api/v1/admin/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const response = await request(server)
        .get('/api/v1/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(1);
    });
  });

  describe('/api/v1/admin/users (GET)', () => {
    it('should return users', async () => {
      const response = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          pageSize: 10,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toHaveLength(10);
    });

    it('should return filtered users when name parameter is provided', async () => {
      const response = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          pageSize: 10,
          name: 'john',
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(
        response.body.data.every((user: any) =>
          user.username.toLowerCase().includes('john'),
        ),
      ).toBe(true);
    });

    it('should filter users by userType', async () => {
      const response = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          pageSize: 10,
          userType: UserTypeEnum.ADMIN,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(
        response.body.data.every(
          (user: any) => user.userType === UserTypeEnum.ADMIN,
        ),
      ).toBe(true);
    });

    it('should sort users by username ASC and DESC', async () => {
      const ascResponse = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          pageSize: 10,
          sortBy: 'username',
          sortOrder: 'ASC',
        })
        .expect(200);

      const usernames = ascResponse.body.data.map((u: any) => u.username);
      const sorted = [...usernames].sort((a: string, b: string) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      );
      expect(usernames).toEqual(sorted);
    });
  });

  describe('/api/v1/admin/users/:id (PATCH)', () => {
    it('should update user status and username', async () => {
      // Create user first
      const createRes = await request(server)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user-to-update',
          password: 'password123',
        })
        .expect(201);

      const userId = createRes.body.data.id;

      const updateRes = await request(server)
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user-updated-name',
        })
        .expect(200);

      expect(updateRes.body.data.username).toBe('user-updated-name');
    });
  });

  describe('/api/v1/admin/users/:id (DELETE) & Soft Delete queries', () => {
    it('should soft delete user and filter with onlyDeleted / includeDeleted', async () => {
      // 1. Create a user to delete
      const createRes = await request(server)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user-to-soft-delete',
          password: 'password123',
        })
        .expect(201);

      const userId = createRes.body.data.id;

      // 2. Soft delete the user
      await request(server)
        .delete(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 3. Normal list query should NOT include the deleted user
      const listRes = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          name: 'user-to-soft-delete',
        })
        .expect(200);

      expect(listRes.body.data.some((u: any) => u.id === userId)).toBe(false);

      // 4. onlyDeleted=true query SHOULD include the deleted user
      const deletedListRes = await request(server)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          name: 'user-to-soft-delete',
          onlyDeleted: true,
        })
        .expect(200);

      expect(deletedListRes.body.data.some((u: any) => u.id === userId)).toBe(
        true,
      );
    });
  });
});
