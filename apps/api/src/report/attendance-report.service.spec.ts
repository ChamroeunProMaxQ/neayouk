import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceStatusEnum } from '@repo/contracts';
import { AttendanceReportService } from './attendance-report.service.js';

describe('AttendanceReportService (Unit)', () => {
  let service: AttendanceReportService;
  let mockStudentAttRepo: any;
  let mockTeacherAttRepo: any;
  let mockLeaveRepo: any;
  let mockClassRepo: any;
  let mockStudentRepo: any;
  let mockStudentClassRepo: any;

  beforeEach(() => {
    mockStudentAttRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockTeacherAttRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockLeaveRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockClassRepo = {
      findOne: vi.fn(),
    };
    mockStudentRepo = {
      findOne: vi.fn(),
    };
    mockStudentClassRepo = {
      find: vi.fn(),
    };

    service = new AttendanceReportService(
      mockStudentAttRepo,
      mockTeacherAttRepo,
      mockLeaveRepo,
      mockClassRepo,
      mockStudentRepo,
      mockStudentClassRepo,
    );
  });

  it('should compute attendance rate and chronic absenteeism lists', async () => {
    const mockStudentAtts = [
      {
        id: 1,
        studentId: 1,
        classId: 1,
        date: '2026-02-16',
        status: AttendanceStatusEnum.PRESENT,
        student: { id: 1, firstName: 'Rith', lastName: 'Meas', guardianPhone: '012345678' },
        class: { id: 1, name: 'Grade 10-A' },
      },
      {
        id: 2,
        studentId: 1,
        classId: 1,
        date: '2026-02-17',
        status: AttendanceStatusEnum.ABSENT,
        student: { id: 1, firstName: 'Rith', lastName: 'Meas', guardianPhone: '012345678' },
        class: { id: 1, name: 'Grade 10-A' },
      },
      {
        id: 3,
        studentId: 1,
        classId: 1,
        date: '2026-02-18',
        status: AttendanceStatusEnum.ABSENT,
        student: { id: 1, firstName: 'Rith', lastName: 'Meas', guardianPhone: '012345678' },
        class: { id: 1, name: 'Grade 10-A' },
      },
      {
        id: 4,
        studentId: 2,
        classId: 1,
        date: '2026-02-16',
        status: AttendanceStatusEnum.PRESENT,
        student: { id: 2, firstName: 'Vireak', lastName: 'Sok', guardianPhone: '098765432' },
        class: { id: 1, name: 'Grade 10-A' },
      },
    ];

    const mockTeacherAtts = [
      { id: 1, teacherId: 10, date: '2026-02-16', status: AttendanceStatusEnum.PRESENT },
    ];

    const mockLeaves = [
      { id: 1, leaveType: 'SICK', status: 'APPROVED', createdAt: new Date() },
    ];

    const createQbMock = (data: any) => ({
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(data),
    });

    mockStudentAttRepo.createQueryBuilder.mockReturnValue(createQbMock(mockStudentAtts));
    mockTeacherAttRepo.createQueryBuilder.mockReturnValue(createQbMock(mockTeacherAtts));
    mockLeaveRepo.createQueryBuilder.mockReturnValue(createQbMock(mockLeaves));

    const result = await service.getSummary({});

    expect(result.totalSessionsRecorded).toBe(4);
    expect(result.teacherAttendanceRate).toBe(100);
    expect(result.totalApprovedLeaves).toBe(1);
    expect(result.leaveTypeBreakdown.length).toBe(1);
    expect(result.leaveTypeBreakdown[0].leaveType).toBe('SICK');
    expect(result.chronicAbsenteeismList.length).toBe(1);
    expect(result.chronicAbsenteeismList[0].studentName).toBe('Meas Rith');
    expect(result.chronicAbsenteeismList[0].absentDays).toBe(2);
  });
});
