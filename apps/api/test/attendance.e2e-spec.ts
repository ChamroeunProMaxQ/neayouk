import type { INestApplication } from '@nestjs/common';
import { UserTypeEnum, AttendanceStatusEnum, LeaveTypeEnum, LeaveStatusEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('AdminAttendanceController (e2e)', () => {
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
  let testStudentId: number;
  let testTeacherId: number;
  let createdLeaveId: number;

  beforeAll(async () => {
    // 1. Fetch class
    const classRes = await request(server)
      .get('/api/v1/admin/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const classList = classRes.body.data?.data || classRes.body.data || [];
    if (classList.length > 0) {
      testClassId = classList[0].id;
    }

    // 2. Fetch student
    const studentRes = await request(server)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const studentList = studentRes.body.data?.data || studentRes.body.data || [];
    if (studentList.length > 0) {
      testStudentId = studentList[0].id;
    }

    // 3. Fetch teacher
    const teacherRes = await request(server)
      .get('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const teacherList = teacherRes.body.data?.data || teacherRes.body.data || [];
    if (teacherList.length > 0) {
      testTeacherId = teacherList[0].id;
    }
  });

  describe('Student Attendance Operations', () => {
    it('POST /api/v1/admin/attendance/students - should record student attendance', async () => {
      const res = await request(server)
        .post('/api/v1/admin/attendance/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudentId,
          classId: testClassId,
          date: '2026-08-17',
          status: AttendanceStatusEnum.PRESENT,
          remarks: 'E2E Present on time',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.studentId).toBe(testStudentId);
      expect(res.body.data.classId).toBe(testClassId);
      expect(res.body.data.status).toBe(AttendanceStatusEnum.PRESENT);
    });

    it('POST /api/v1/admin/attendance/students/batch - should batch record attendance for class', async () => {
      const res = await request(server)
        .post('/api/v1/admin/attendance/students/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: testClassId,
          date: '2026-08-17',
          records: [
            { studentId: testStudentId, status: AttendanceStatusEnum.LATE, remarks: 'Late by 10m' },
          ],
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].status).toBe(AttendanceStatusEnum.LATE);
    });

    it('GET /api/v1/admin/attendance/students - should list student attendances with filters', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/attendance/students?classId=${testClassId}&date=2026-08-17`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      const list = res.body.data?.data || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });

    it('GET /api/v1/admin/attendance/students/matrix - should return sheet matrix for date range', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/attendance/students/matrix?classId=${testClassId}&startDate=2026-08-15&endDate=2026-08-17`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.classId).toBe(testClassId);
      expect(res.body.data.dates).toBeDefined();
      expect(res.body.data.rows).toBeDefined();
    });

    it('GET /api/v1/admin/attendance/students/summary - should return class attendance summary', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/attendance/students/summary?classId=${testClassId}&date=2026-08-17`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.classId).toBe(testClassId);
      expect(res.body.data.date).toBe('2026-08-17');
      expect(typeof res.body.data.attendanceRate).toBe('number');
    });
  });

  describe('Teacher Attendance Operations', () => {
    it('POST /api/v1/admin/attendance/teachers - should record teacher daily attendance and compute hours', async () => {
      const res = await request(server)
        .post('/api/v1/admin/attendance/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teacherId: testTeacherId,
          date: '2026-08-17',
          checkInTime: '07:30',
          checkOutTime: '11:30',
          status: AttendanceStatusEnum.PRESENT,
          remarks: 'Morning shift completed',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.teacherId).toBe(testTeacherId);
      expect(res.body.data.hoursWorked).toBe(4);
    });

    it('GET /api/v1/admin/attendance/teachers - should list teacher attendances', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/attendance/teachers?teacherId=${testTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      const list = res.body.data?.data || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });

    it('GET /api/v1/admin/attendance/teachers/summary - should return monthly attendance and payroll estimates', async () => {
      const res = await request(server)
        .get(`/api/v1/admin/attendance/teachers/summary?teacherId=${testTeacherId}&month=2026-08`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.teacherId).toBe(testTeacherId);
      expect(typeof res.body.data.totalHoursWorked).toBe('number');
      expect(typeof res.body.data.estimatedSalary).toBe('number');
    });
  });

  describe('Leave Request Operations & Approval Auto-Sync', () => {
    it('POST /api/v1/admin/attendance/leave-requests - should create leave request with status PENDING', async () => {
      const res = await request(server)
        .post('/api/v1/admin/attendance/leave-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teacherId: testTeacherId,
          leaveType: LeaveTypeEnum.SICK,
          startDate: '2026-08-25',
          endDate: '2026-08-26',
          totalDays: 2.0,
          reason: 'Medical checkup and rest',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe(LeaveStatusEnum.PENDING);
      expect(res.body.data.teacherId).toBe(testTeacherId);
      createdLeaveId = res.body.data.id;
    });

    it('GET /api/v1/admin/attendance/leave-requests - should list leave requests', async () => {
      const res = await request(server)
        .get('/api/v1/admin/attendance/leave-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      const list = res.body.data?.data || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });

    it('PATCH /api/v1/admin/attendance/leave-requests/:id - should update pending leave request', async () => {
      const res = await request(server)
        .patch(`/api/v1/admin/attendance/leave-requests/${createdLeaveId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Updated: Annual medical checkup',
        })
        .expect(200);

      expect(res.body.data.reason).toBe('Updated: Annual medical checkup');
    });

    it('POST /api/v1/admin/attendance/leave-requests/:id/review - should approve leave and auto-sync ON_LEAVE attendances', async () => {
      const res = await request(server)
        .post(`/api/v1/admin/attendance/leave-requests/${createdLeaveId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: LeaveStatusEnum.APPROVED,
          syncAttendance: true,
        })
        .expect(201);

      expect(res.body.data.status).toBe(LeaveStatusEnum.APPROVED);

      // Verify that teacher attendance records were auto-created for 2026-08-25 with ON_LEAVE
      const attRes = await request(server)
        .get(`/api/v1/admin/attendance/teachers?teacherId=${testTeacherId}&date=2026-08-25`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const list = attRes.body.data?.data || attRes.body.data;
      expect(list).toHaveLength(1);
      expect(list[0].status).toBe(AttendanceStatusEnum.ON_LEAVE);
    });

    it('DELETE /api/v1/admin/attendance/leave-requests/:id - should delete leave request', async () => {
      await request(server)
        .delete(`/api/v1/admin/attendance/leave-requests/${createdLeaveId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Security & Validation Error Conditions', () => {
    it('GET /api/v1/admin/attendance/students - should reject unauthenticated request with 401', async () => {
      await request(server)
        .get('/api/v1/admin/attendance/students')
        .expect(401);
    });

    it('POST /api/v1/admin/attendance/leave-requests - should return 400 when dates are inverted', async () => {
      await request(server)
        .post('/api/v1/admin/attendance/leave-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teacherId: testTeacherId,
          leaveType: LeaveTypeEnum.SICK,
          startDate: '2026-08-30',
          endDate: '2026-08-20',
          totalDays: 1,
          reason: 'Bad dates',
        })
        .expect(400);
    });
  });
});
