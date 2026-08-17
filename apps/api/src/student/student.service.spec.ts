import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  StudentStatusEnum,
  SemesterEnum,
  ClassEnrollmentStatusEnum,
  PaymentStatusEnum,
} from '@repo/contracts';
import { StudentService } from './student.service.js';
import type { Student } from './entity/student.entity.js';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { StudentClass } from './entity/student-class.entity.js';

describe('StudentService (Unit)', () => {
  let service: StudentService;
  let mockStudentRepo: any;
  let mockStudentClassRepo: any;
  let mockClassRepo: any;
  let mockPaymentService: any;

  beforeEach(() => {
    mockStudentRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 1 })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id ?? 1 })),
      count: vi.fn().mockResolvedValue(10),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockStudentClassRepo = {
      create: vi.fn((data) => ({ ...data, id: 101 })),
      save: vi.fn(async (entities) => entities),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockClassRepo = {
      findBy: vi.fn().mockResolvedValue([
        {
          id: 10,
          name: 'Grade 10-A',
          monthlyFee: 50.0,
          academicYear: '2025-2026',
          semester: SemesterEnum.SEMESTER_1,
        },
      ]),
      findOne: vi.fn(),
    };

    mockPaymentService = {
      getStudentPaymentSummary: vi.fn().mockResolvedValue({
        studentId: 1,
        totalPaidAmount: 50,
        totalUnpaidMonths: 0,
        unpaidMonthsList: [],
        totalOutstandingAmount: 0,
        lastPaymentDate: new Date(),
      }),
    };

    service = new StudentService(
      mockStudentRepo,
      mockStudentClassRepo,
      mockClassRepo,
      mockPaymentService,
    );
  });

  describe('create', () => {
    it('should create a student with auto-generated code and enrollments', async () => {
      const dto = {
        firstName: 'Sokha',
        lastName: 'Chan',
        firstNameKm: 'សុខា',
        lastNameKm: 'ចាន់',
        gender: 'MALE' as const,
        contact: '012345678',
        discount: 10,
        classIds: [10],
      };

      mockStudentRepo.findOne.mockResolvedValueOnce({
        id: 1,
        ...dto,
        enrollments: [],
        payments: [],
      });

      const result = await service.create(dto);

      expect(mockStudentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentCode: expect.stringMatching(/^STU-\d{4}-\d{6}$/),
          firstName: 'Sokha',
          lastName: 'Chan',
          discount: 10,
        }),
      );
      expect(mockStudentClassRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.firstName).toBe('Sokha');
    });

    it('should respect custom studentCode when provided in DTO', async () => {
      const dto = {
        studentCode: 'CUSTOM-001',
        firstName: 'Dara',
        lastName: 'Keo',
        gender: 'MALE' as const,
      };

      mockStudentRepo.findOne.mockResolvedValueOnce({
        id: 2,
        ...dto,
        enrollments: [],
        payments: [],
      });

      await service.create(dto);

      expect(mockStudentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentCode: 'CUSTOM-001',
          firstName: 'Dara',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when student does not exist', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return student with computed payment summary', async () => {
      const studentData = {
        id: 1,
        uuid: 'stu-uuid-1',
        firstName: 'Sokha',
        lastName: 'Chan',
        status: StudentStatusEnum.ACTIVE,
      };
      mockStudentRepo.findOne.mockResolvedValueOnce(studentData);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.paymentSummary).toBeDefined();
      expect(result.paymentSummary.totalPaidAmount).toBe(50);
      expect(mockPaymentService.getStudentPaymentSummary).toHaveBeenCalledWith(studentData);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if student is not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update(999, { firstName: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update student details and replace active enrollments', async () => {
      const existingStudent = {
        id: 1,
        uuid: 'stu-uuid-1',
        firstName: 'Old',
        lastName: 'Name',
      };
      mockStudentRepo.findOne.mockResolvedValueOnce(existingStudent);
      mockStudentRepo.findOne.mockResolvedValueOnce({
        ...existingStudent,
        firstName: 'New',
      });

      const result = await service.update(1, {
        firstName: 'New',
        classIds: [10],
      });

      expect(existingStudent.firstName).toBe('New');
      expect(mockStudentRepo.save).toHaveBeenCalledWith(existingStudent);
      expect(mockStudentClassRepo.delete).toHaveBeenCalledWith({
        studentId: 1,
        status: ClassEnrollmentStatusEnum.ENROLLED,
      });
      expect(mockStudentClassRepo.save).toHaveBeenCalled();
      expect(result.firstName).toBe('New');
    });
  });

  describe('promoteStudent', () => {
    it('should complete previous enrollment and create new active enrollment', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({
        id: 1,
        uuid: 'stu-uuid-1',
        firstName: 'Sokha',
      });
      mockStudentRepo.findOne.mockResolvedValueOnce({
        id: 1,
        uuid: 'stu-uuid-1',
        firstName: 'Sokha',
      });

      const dto = {
        studentId: 1,
        fromClassId: 10,
        toClassId: 20,
        academicYear: '2026-2027',
        semester: SemesterEnum.SEMESTER_1,
        completePreviousEnrollment: true,
        remarks: 'Promoted to Grade 11',
      };

      await service.promoteStudent(dto);

      expect(mockStudentClassRepo.update).toHaveBeenCalledWith(
        {
          studentId: 1,
          classId: 10,
          status: ClassEnrollmentStatusEnum.ENROLLED,
        },
        expect.objectContaining({
          status: ClassEnrollmentStatusEnum.COMPLETED,
          remarks: 'Promoted to Grade 11',
        }),
      );

      expect(mockStudentClassRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          classId: 20,
          status: ClassEnrollmentStatusEnum.ENROLLED,
          isPrimary: true,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should soft delete student', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 1 });

      const result = await service.delete(1);

      expect(mockStudentRepo.softDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, success: true });
    });
  });
});
