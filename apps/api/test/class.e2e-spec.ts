import type { INestApplication } from '@nestjs/common';
import {
  UserTypeEnum,
  SemesterEnum,
  ShiftEnum,
  DayOfWeekEnum,
} from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminClassController and Timetable (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    adminToken = ctx.createToken({
      sub: 1,
      username: 'admin',
      type: UserTypeEnum.ADMIN,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  let testClassId: number;
  let createdSlotId: number;

  describe('/api/v1/admin/classes CRUD with shift, room, and windows', () => {
    it('POST /api/v1/admin/classes - should create a class with shift and schedule windows', async () => {
      const res = await request(server)
        .post('/api/v1/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Primary - Grade 3B',
          code: 'G3-B',
          gradeLevel: '3',
          program: 'Primary',
          section: 'B',
          room: 'Room 302',
          shift: ShiftEnum.MORNING,
          startTime: '07:30',
          endTime: '11:30',
          startDate: '2025-09-01',
          endDate: '2026-06-30',
          monthlyFee: 70.0,
          academicYear: '2025-2026',
          semester: SemesterEnum.SEMESTER_1,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Primary - Grade 3B');
      expect(res.body.data.room).toBe('Room 302');
      expect(res.body.data.shift).toBe('MORNING');
      testClassId = res.body.data.id;
    });

    it('GET /api/v1/admin/classes - should list classes with search and shift filter', async () => {
      const res = await request(server)
        .get('/api/v1/admin/classes?search=Grade 3B&shift=MORNING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].code).toBe('G3-B');
    });

    it('GET /api/v1/admin/classes/:id - should get class details with studentCount', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/classes/${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(testClassId);
      expect(res.body.data.studentCount).toBeDefined();
    });

    it('PATCH /api/v1/admin/classes/:id - should update class details', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/classes/${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          room: 'Room 305',
          monthlyFee: 75.0,
        })
        .expect(200);

      expect(res.body.data.room).toBe('Room 305');
      expect(Number(res.body.data.monthlyFee)).toBe(75.0);
    });

    it('GET /api/v1/admin/classes/:id/students - should return student roster', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/classes/${testClassId}/students`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Timetable Slots and Schedule Overlap Validation', () => {
    it('POST /api/v1/admin/classes/:id/timetable - should create a weekly schedule slot', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/classes/${testClassId}/timetable`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayOfWeek: DayOfWeekEnum.MONDAY,
          subject: 'Mathematics',
          subjectCode: 'MATH-301',
          teacherName: 'Mr. Sokha',
          room: 'Room 305',
          startTime: '07:30',
          endTime: '09:00',
          colorTag: '#45AC5E',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.subject).toBe('Mathematics');
      createdSlotId = res.body.data.id;
    });

    it('POST /api/v1/admin/classes/:id/timetable - should throw 409 Conflict when slots overlap in same class', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/classes/${testClassId}/timetable`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayOfWeek: DayOfWeekEnum.MONDAY,
          subject: 'English',
          startTime: '08:00',
          endTime: '09:30',
        })
        .expect(409);

      expect(res.body.message).toContain('Time slot conflict');
    });

    it('GET /api/v1/admin/classes/:id/timetable - should get class timetable slots', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/classes/${testClassId}/timetable`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(createdSlotId);
    });

    it('PATCH /api/v1/admin/classes/timetable/:slotId - should update slot details', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/classes/timetable/${createdSlotId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Bring geometry kit',
        })
        .expect(200);

      expect(res.body.data.notes).toBe('Bring geometry kit');
    });

    it('DELETE /api/v1/admin/classes/timetable/:slotId - should delete schedule slot', async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/classes/timetable/${createdSlotId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.success).toBe(true);
    });
  });

  describe('Cleanup Class', () => {
    it('DELETE /api/v1/admin/classes/:id - should soft delete class', async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/classes/${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(testClassId);
    });
  });
});
