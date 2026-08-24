import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { TeacherAttendanceService } from './teacher-attendance.service.js';
import { AttendanceStatusEnum } from '@repo/contracts';

describe('TeacherAttendanceService', () => {
  let service: TeacherAttendanceService;
  let mockAttendanceRepo: any;
  let mockTeacherRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockAttendanceRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'tatt-1', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({
          id: entity.id || 1,
          uuid: entity.uuid || 'tatt-1',
          ...entity,
        }),
      ),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
    };

    mockTeacherRepo = {
      findOne: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    service = new TeacherAttendanceService(
      mockAttendanceRepo,
      mockTeacherRepo,
      mockLogger,
    );
  });

  describe('1. Happy Path (200/201 Success)', () => {
    it('should record teacher daily attendance with calculated hours worked', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'John Sok',
        salaryInHour: 15.0,
      });
      mockAttendanceRepo.findOne.mockResolvedValue(null);

      const dto = {
        teacherId: 1,
        date: '2026-08-17',
        checkInTime: '07:30',
        checkOutTime: '11:30',
        status: AttendanceStatusEnum.PRESENT,
      };

      const result = await service.recordAttendance(dto, 99);
      expect(result).toBeDefined();
      expect(mockAttendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: 1,
          date: '2026-08-17',
          checkInTime: '07:30',
          checkOutTime: '11:30',
          hoursWorked: 4,
          status: AttendanceStatusEnum.PRESENT,
          verifiedBy: 99,
        }),
      );
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('should update existing teacher attendance record on duplicate check-in', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({ id: 1, name: 'John Sok' });
      const existing = {
        id: 1,
        teacherId: 1,
        date: '2026-08-17',
        checkInTime: '07:30',
        checkOutTime: null,
        hoursWorked: 0,
        status: AttendanceStatusEnum.PRESENT,
      };
      mockAttendanceRepo.findOne.mockResolvedValue(existing);

      const dto = {
        teacherId: 1,
        date: '2026-08-17',
        checkInTime: '07:30',
        checkOutTime: '12:00',
        status: AttendanceStatusEnum.PRESENT,
      };

      const result = await service.recordAttendance(dto, 99);
      expect(result).toBeDefined();
      expect(mockAttendanceRepo.merge).toHaveBeenCalledWith(
        existing,
        expect.objectContaining({
          checkOutTime: '12:00',
          hoursWorked: 4.5,
        }),
      );
    });

    it('should calculate monthly attendance and estimated salary summary', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'John Sok',
        teacherCode: 'TCH-001',
        salaryInHour: 20.0,
      });

      mockAttendanceRepo.find.mockResolvedValue([
        { hoursWorked: 4.0, status: AttendanceStatusEnum.PRESENT },
        { hoursWorked: 4.0, status: AttendanceStatusEnum.PRESENT },
        { hoursWorked: 3.5, status: AttendanceStatusEnum.LATE },
        { hoursWorked: 0, status: AttendanceStatusEnum.ON_LEAVE },
      ]);

      const summary = await service.getTeacherMonthlySummary(1, '2026-08');
      expect(summary.totalHoursWorked).toBe(11.5);
      expect(summary.estimatedSalary).toBe(230); // 11.5 * 20
      expect(summary.daysPresent).toBe(2);
      expect(summary.daysLate).toBe(1);
      expect(summary.daysOnLeave).toBe(1);
    });
  });

  describe('2. Resource Not Found (404 Not Found)', () => {
    it('should throw NotFoundException if teacher does not exist', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      await expect(
        service.recordAttendance({
          teacherId: 999,
          date: '2026-08-17',
          status: AttendanceStatusEnum.PRESENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
