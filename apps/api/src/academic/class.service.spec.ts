import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClassService } from './class.service.js';
import { DayOfWeekEnum, SemesterEnum, ShiftEnum } from '@repo/contracts';

describe('ClassService', () => {
  let service: ClassService;
  let mockClassRepo: any;
  let mockTimetableRepo: any;
  let mockStudentClassRepo: any;

  beforeEach(() => {
    mockClassRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'cls-uuid-1', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({ id: entity.id || 1, ...entity }),
      ),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockTimetableRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 10, uuid: 'slot-uuid-10', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({ id: entity.id || 10, ...entity }),
      ),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockStudentClassRepo = {
      find: vi.fn(),
    };

    service = new ClassService(
      mockClassRepo,
      mockTimetableRepo,
      mockStudentClassRepo,
    );
  });

  // 1. Happy Path
  describe('Happy Path (200/201 Success)', () => {
    it('should create a class with default values', async () => {
      const dto = {
        name: 'Primary - Grade 1A',
        code: 'G1-A',
        gradeLevel: '1',
        program: 'Primary',
        shift: ShiftEnum.MORNING,
        startTime: '07:30',
        endTime: '11:30',
        academicYear: '2025-2026',
        semester: SemesterEnum.SEMESTER_1,
        monthlyFee: 65.0,
      };

      mockClassRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 1,
        name: 'Primary - Grade 1A',
        enrollments: [],
        timetables: [],
      });

      const result = await service.create(dto as any);
      expect(result).toBeDefined();
      expect((result as any).name).toBe('Primary - Grade 1A');
      expect(mockClassRepo.create).toHaveBeenCalled();
      expect(mockClassRepo.save).toHaveBeenCalled();
    });

    it('should find one class by ID with relations', async () => {
      const mockClass = {
        id: 1,
        uuid: 'cls-uuid-1',
        name: 'Primary - Grade 1A',
        enrollments: [
          {
            id: 1,
            status: 'ENROLLED',
            student: { id: 101, firstName: 'Sokha' },
          },
        ],
        timetables: [{ id: 10, subject: 'Mathematics' }],
      };
      mockClassRepo.findOne.mockResolvedValue(mockClass);

      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Primary - Grade 1A');
      expect(mockClassRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['enrollments', 'timetables', 'program', 'teacher'],
      });
    });

    it('should retrieve student roster for a class', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Grade 1A' });
      mockStudentClassRepo.find.mockResolvedValue([
        {
          id: 1,
          studentId: 101,
          student: { firstName: 'Sokha', lastName: 'Chan' },
          status: 'ENROLLED',
        },
      ]);

      const result = await service.getStudents(1);
      expect(result).toHaveLength(1);
      expect(result?.[0]?.student?.firstName).toBe('Sokha');
    });

    it('should create a timetable schedule slot without conflict', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Grade 1A' });

      // Mock conflict query to return null (no overlap)
      const qb: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        innerJoinAndSelect: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      mockTimetableRepo.createQueryBuilder.mockReturnValue(qb);

      const dto = {
        dayOfWeek: DayOfWeekEnum.MONDAY,
        subject: 'Mathematics',
        startTime: '08:00',
        endTime: '09:30',
        room: 'Room 101',
      };

      const slot = await service.createTimetableSlot(1, dto as any);
      expect(slot).toBeDefined();
      expect(slot.subject).toBe('Mathematics');
      expect(mockTimetableRepo.save).toHaveBeenCalled();
    });

    it('should delete a timetable slot', async () => {
      mockTimetableRepo.findOne.mockResolvedValue({ id: 10, classId: 1 });
      const result = await service.deleteTimetableSlot(10);
      expect(result).toEqual({ id: 10, success: true });
      expect(mockTimetableRepo.delete).toHaveBeenCalledWith(10);
    });
  });

  // 2. Validation Failures (400)
  describe('Validation Failures (400 Bad Request)', () => {
    it('should throw BadRequestException when timetable endTime <= startTime', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Grade 1A' });

      const dto = {
        dayOfWeek: DayOfWeekEnum.MONDAY,
        subject: 'Mathematics',
        startTime: '10:00',
        endTime: '08:00',
      };

      await expect(service.createTimetableSlot(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 3. Duplicate & Conflict Failures (409)
  describe('Duplicate & Schedule Conflicts (409 Conflict)', () => {
    it('should throw ConflictException when time slots overlap within the same class', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Grade 1A' });

      const qb: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        innerJoinAndSelect: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: 5,
          subject: 'Khmer Literature',
          startTime: '08:00',
          endTime: '09:30',
        }),
      };
      mockTimetableRepo.createQueryBuilder.mockReturnValue(qb);

      const dto = {
        dayOfWeek: DayOfWeekEnum.MONDAY,
        subject: 'Mathematics',
        startTime: '08:30',
        endTime: '10:00',
      };

      await expect(service.createTimetableSlot(1, dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // 4. Not Found (404)
  describe('Not Found (404)', () => {
    it('should throw NotFoundException when class ID does not exist', async () => {
      mockClassRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when timetable slot does not exist on delete', async () => {
      mockTimetableRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteTimetableSlot(99999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 5. Edge & Boundary Limits
  describe('Edge & Boundary Limits', () => {
    it('should handle class with empty enrollments and calculate studentCount as 0', async () => {
      const mockClass = {
        id: 2,
        uuid: 'cls-uuid-2',
        name: 'Empty Class',
        enrollments: [],
      };
      mockClassRepo.findOne.mockResolvedValue(mockClass);

      const res = await service.findOne(2);
      expect(res.studentCount).toBe(0);
    });

    it('should aggregate academic years and semesters correctly in getAcademicYearsSummary', async () => {
      const mockRaw = [
        {
          academicYear: '2025-2026',
          semester: 'SEMESTER_1',
          classCount: '5',
          studentCount: '42',
        },
      ];

      const qb: any = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue(mockRaw),
      };
      mockClassRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.getAcademicYearsSummary();
      expect(res).toEqual([
        {
          academicYear: '2025-2026',
          semester: 'SEMESTER_1',
          classCount: 5,
          studentCount: 42,
        },
      ]);
    });
  });
});
