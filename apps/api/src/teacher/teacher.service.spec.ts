import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeacherService } from './teacher.service.js';
import {
  TeacherGenderEnum,
  UserStatusEnum,
  UserTypeEnum,
} from '@repo/contracts';

describe('TeacherService', () => {
  let service: TeacherService;
  let mockTeacherRepo: any;
  let mockUserRepo: any;
  let mockRoleRepo: any;
  let mockClassRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockTeacherRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'tch-uuid-1', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({
          id: entity.id || 1,
          uuid: entity.uuid || 'tch-uuid-1',
          ...entity,
        }),
      ),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
      count: vi.fn().mockResolvedValue(5),
    };

    mockUserRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ id: 101, uuid: 'usr-uuid-101', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({ id: entity.id || 101, ...entity }),
      ),
    };

    mockRoleRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ id: 2, ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({ id: entity.id || 2, ...entity }),
      ),
    };

    mockClassRepo = {
      find: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    service = new TeacherService(
      mockTeacherRepo,
      mockUserRepo,
      mockRoleRepo,
      mockClassRepo,
      mockLogger,
    );
  });

  // 1. Happy Path
  describe('1. Happy Path (200/201 Success)', () => {
    it('should create a teacher with standard fields', async () => {
      const dto = {
        name: 'John Sok',
        nameKm: 'សុខ ចន',
        teacherCode: 'TCH-0001',
        gender: TeacherGenderEnum.MALE,
        salaryInHour: 15.5,
        phone: '012345678',
        email: 'john@example.com',
        specialization: 'Mathematics',
        status: 'ACTIVE',
      };

      mockTeacherRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.teacherCode === 'TCH-0001') return null;
        if (where.id === 1) {
          return {
            id: 1,
            uuid: 'tch-uuid-1',
            ...dto,
            classes: [],
            user: null,
          };
        }
        return null;
      });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('John Sok');
      expect(result.salaryInHour).toBe(15.5);
      expect(mockTeacherRepo.create).toHaveBeenCalled();
      expect(mockTeacherRepo.save).toHaveBeenCalled();
    });

    it('should create a teacher and auto-provision user account with userType CMS and role teacher', async () => {
      const dto = {
        name: 'Sreymom Chan',
        teacherCode: 'TCH-0002',
        createAccount: true,
        username: 'teacher_sreymom',
        password: 'password123',
      };

      mockTeacherRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.teacherCode === 'TCH-0002') return null;
        if (where.id === 1) {
          return {
            id: 1,
            uuid: 'tch-uuid-2',
            name: 'Sreymom Chan',
            teacherCode: 'TCH-0002',
            userId: 101,
            user: {
              id: 101,
              username: 'teacher_sreymom',
              userType: UserTypeEnum.CMS,
            },
            classes: [],
          };
        }
        return null;
      });

      mockUserRepo.findOne.mockResolvedValue(null); // username check
      mockRoleRepo.findOne.mockResolvedValue({
        id: 2,
        slug: 'teacher',
        name: 'Teacher',
      });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'teacher_sreymom',
          userType: UserTypeEnum.CMS,
          status: UserStatusEnum.ACTIVE,
        }),
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should find one teacher by ID with relations', async () => {
      const mockTeacher = {
        id: 1,
        uuid: 'tch-uuid-1',
        name: 'John Sok',
        salaryInHour: '15.00',
        gender: 'MALE',
        status: 'ACTIVE',
        classes: [
          { id: 10, uuid: 'cls-10', name: 'Grade 1A', enrollments: [] },
        ],
        user: { id: 101, username: 'teacher_john', userType: 'CMS' },
      };
      mockTeacherRepo.findOne.mockResolvedValue(mockTeacher);

      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('John Sok');
      expect(result.salaryInHour).toBe(15);
      expect(result.classCount).toBe(1);
    });

    it('should retrieve assigned classes for a teacher', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({ id: 1, name: 'John Sok' });
      mockClassRepo.find.mockResolvedValue([
        {
          id: 10,
          name: 'Grade 1A',
          program: { name: 'Primary' },
          enrollments: [{ id: 1, status: 'ENROLLED' }],
        },
      ]);

      const result = await service.getAssignedClasses(1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Grade 1A');
      expect(result[0].studentCount).toBe(1);
    });

    it('should update teacher details and salary rate', async () => {
      mockTeacherRepo.findOne.mockImplementation(async () => {
        return {
          id: 1,
          name: 'John Sok Senior',
          salaryInHour: 22.0,
          classes: [],
        };
      });

      const result = await service.update(1, {
        name: 'John Sok Senior',
        salaryInHour: 22.0,
      });
      expect(result.name).toBe('John Sok Senior');
      expect(result.salaryInHour).toBe(22);
    });

    it('should soft delete teacher', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({ id: 1, name: 'John Sok' });
      const result = await service.delete(1);
      expect(result).toEqual({ id: 1, success: true });
      expect(mockTeacherRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  // 2. Validation & Argument Edge Cases
  describe('2. Validation & Argument Edge Cases (400 / Bad Request)', () => {
    it('should auto-generate teacherCode when not provided', async () => {
      mockTeacherRepo.count.mockResolvedValue(9);
      mockTeacherRepo.findOne.mockImplementation(async () => {
        return {
          id: 10,
          name: 'New Teacher',
          teacherCode: 'TCH-0010',
          classes: [],
        };
      });

      await service.create({ name: 'New Teacher' });
      expect(mockTeacherRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherCode: 'TCH-0010',
        }),
      );
    });
  });

  // 3. Duplicate & Uniqueness Conflicts (409 Conflict)
  describe('3. Duplicate & Uniqueness Conflicts (409 Conflict)', () => {
    it('should throw ConflictException if teacherCode already exists', async () => {
      mockTeacherRepo.findOne.mockResolvedValue({
        id: 99,
        teacherCode: 'TCH-DUPLICATE',
      });

      await expect(
        service.create({
          name: 'Duplicate Teacher',
          teacherCode: 'TCH-DUPLICATE',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username already taken during account creation', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({
        id: 50,
        username: 'existing_user',
      });

      await expect(
        service.create({
          name: 'Teacher Test',
          createAccount: true,
          username: 'existing_user',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if userId is already linked to another teacher', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 101, username: 'user101' });
      mockTeacherRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.userId === 101) {
          return { id: 77, name: 'Other Teacher', userId: 101 };
        }
        return null;
      });

      await expect(
        service.create({
          name: 'New Teacher',
          userId: 101,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 4. Resource Not Found (404 Not Found)
  describe('4. Resource Not Found (404 Not Found)', () => {
    it('should throw NotFoundException when finding non-existent teacher', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when updating non-existent teacher', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      await expect(service.update(999, { name: 'Nobody' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when deleting non-existent teacher', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when binding non-existent userId', async () => {
      mockTeacherRepo.findOne.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Teacher', userId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 5. Account Unbinding & Password Updates
  describe('5. Account Unbinding & Password Updates', () => {
    it('should unbind user account when unbindUser is true', async () => {
      const existingTeacher = {
        id: 1,
        name: 'John Sok',
        userId: 101,
        user: { id: 101, username: 'teacher_john' },
        classes: [],
      };
      mockTeacherRepo.findOne.mockResolvedValue(existingTeacher);

      await service.update(1, { unbindUser: true });
      expect(mockTeacherRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, user: null }),
      );
    });
  });

  // 6. Edge & Boundary Limits
  describe('6. Edge & Boundary Limits', () => {
    it('should handle zero hourly salary and null optional fields', async () => {
      mockTeacherRepo.findOne.mockImplementation(async () => {
        return {
          id: 5,
          uuid: 'tch-uuid-5',
          name: 'Volunteer Teacher',
          salaryInHour: 0,
          specialization: null,
          phone: null,
          email: null,
          classes: [],
        };
      });

      const result = await service.create({
        name: 'Volunteer Teacher',
        salaryInHour: 0,
      });

      expect(result.salaryInHour).toBe(0);
      expect(result.phone).toBeNull();
    });
  });
});
