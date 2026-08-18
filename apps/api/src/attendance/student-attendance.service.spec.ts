import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StudentAttendanceService } from './student-attendance.service.js';
import { AttendanceStatusEnum, ClassEnrollmentStatusEnum } from '@repo/contracts';

describe('StudentAttendanceService', () => {
  let service: StudentAttendanceService;
  let mockAttendanceRepo: any;
  let mockStudentRepo: any;
  let mockClassRepo: any;
  let mockStudentClassRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockAttendanceRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'att-uuid-1', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({ id: entity.id || 1, uuid: entity.uuid || 'att-uuid-1', ...entity }),
      ),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
    };

    mockStudentRepo = {
      findOne: vi.fn(),
    };

    mockClassRepo = {
      findOne: vi.fn(),
    };

    mockStudentClassRepo = {
      find: vi.fn(),
      count: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    service = new StudentAttendanceService(
      mockAttendanceRepo,
      mockStudentRepo,
      mockClassRepo,
      mockStudentClassRepo,
      mockLogger,
    );
  });

  // 1. Happy Path
  describe('1. Happy Path (200/201 Success)', () => {
    it('should record new student attendance record', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 1, firstName: 'Sokha', lastName: 'Chan' });
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });
      mockAttendanceRepo.findOne.mockResolvedValue(null);

      const dto = {
        studentId: 1,
        classId: 10,
        date: '2026-08-17',
        status: AttendanceStatusEnum.PRESENT,
        remarks: 'On time',
      };

      const result = await service.recordAttendance(dto, 101);
      expect(result).toBeDefined();
      expect(mockAttendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          classId: 10,
          date: '2026-08-17',
          status: AttendanceStatusEnum.PRESENT,
          recordedBy: 101,
        }),
      );
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('should update existing attendance record idempotently', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 1, firstName: 'Sokha', lastName: 'Chan' });
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });

      const existing = {
        id: 5,
        uuid: 'att-5',
        studentId: 1,
        classId: 10,
        date: '2026-08-17',
        status: AttendanceStatusEnum.ABSENT,
        remarks: null,
      };

      mockAttendanceRepo.findOne.mockResolvedValue(existing);

      const dto = {
        studentId: 1,
        classId: 10,
        date: '2026-08-17',
        status: AttendanceStatusEnum.EXCUSED,
        remarks: 'Doctor note provided',
      };

      const result = await service.recordAttendance(dto, 101);
      expect(result).toBeDefined();
      expect(mockAttendanceRepo.merge).toHaveBeenCalledWith(
        existing,
        expect.objectContaining({
          status: AttendanceStatusEnum.EXCUSED,
          remarks: 'Doctor note provided',
          recordedBy: 101,
        }),
      );
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('should batch record attendance for multiple students', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });
      mockStudentRepo.findOne.mockImplementation(async ({ where }: any) => {
        return { id: where.id, firstName: `Student${where.id}`, lastName: 'Test' };
      });
      mockAttendanceRepo.findOne.mockResolvedValue(null);

      const dto = {
        classId: 10,
        date: '2026-08-17',
        records: [
          { studentId: 1, status: AttendanceStatusEnum.PRESENT },
          { studentId: 2, status: AttendanceStatusEnum.LATE, remarks: 'Traffic' },
          { studentId: 3, status: AttendanceStatusEnum.ABSENT },
        ],
      };

      const results = await service.batchRecordAttendance(dto, 101);
      expect(results).toHaveLength(3);
    });

    it('should return monthly sheet matrix with accurate rates', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });
      mockStudentClassRepo.find.mockResolvedValue([
        {
          studentId: 1,
          status: ClassEnrollmentStatusEnum.ENROLLED,
          student: { id: 1, studentCode: 'STU-001', firstName: 'Sokha', lastName: 'Chan', gender: 'FEMALE' },
        },
      ]);

      mockAttendanceRepo.find.mockResolvedValue([
        { id: 101, studentId: 1, classId: 10, date: '2026-08-15', status: AttendanceStatusEnum.PRESENT },
        { id: 102, studentId: 1, classId: 10, date: '2026-08-16', status: AttendanceStatusEnum.LATE },
      ]);

      const matrix = await service.getMatrix(10, '2026-08-15', '2026-08-17');
      expect(matrix.totalStudents).toBe(1);
      expect(matrix.dates).toEqual(['2026-08-15', '2026-08-16', '2026-08-17']);
      expect(matrix.rows).toHaveLength(1);
      expect(matrix.rows[0].totalPresent).toBe(1);
      expect(matrix.rows[0].totalLate).toBe(1);
      expect(matrix.rows[0].attendances['2026-08-15']?.status).toBe(AttendanceStatusEnum.PRESENT);
    });

    it('should compute class daily attendance summary', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });
      mockStudentClassRepo.count.mockResolvedValue(20);
      mockAttendanceRepo.find.mockResolvedValue([
        { status: AttendanceStatusEnum.PRESENT },
        { status: AttendanceStatusEnum.PRESENT },
        { status: AttendanceStatusEnum.LATE },
        { status: AttendanceStatusEnum.ABSENT },
      ]);

      const summary = await service.getClassSummary(10, '2026-08-17');
      expect(summary.totalEnrolled).toBe(20);
      expect(summary.presentCount).toBe(2);
      expect(summary.lateCount).toBe(1);
      expect(summary.absentCount).toBe(1);
    });
  });

  // 2. Validation & Not Found
  describe('2. Validation & Resource Not Found (404 / 400)', () => {
    it('should throw NotFoundException if student does not exist', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.recordAttendance({ studentId: 999, classId: 10, date: '2026-08-17', status: AttendanceStatusEnum.PRESENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 1 });
      mockClassRepo.findOne.mockResolvedValue(null);
      await expect(
        service.recordAttendance({ studentId: 1, classId: 999, date: '2026-08-17', status: AttendanceStatusEnum.PRESENT }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if matrix startDate is after endDate', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 10, name: 'Grade 1A' });
      mockStudentClassRepo.find.mockResolvedValue([]);

      await expect(service.getMatrix(10, '2026-08-20', '2026-08-10')).rejects.toThrow(BadRequestException);
    });
  });
});
