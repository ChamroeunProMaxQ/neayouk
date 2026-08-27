import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StaffService } from './staff.service.js';
import {
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  StaffStatusEnum,
} from '@repo/contracts';

describe('StaffService (Unit)', () => {
  let service: StaffService;
  let mockStaffRepo: any;
  let mockUserRepo: any;
  let mockRoleRepo: any;
  let mockClassRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockStaffRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({
        ...dto,
        id: 1,
        uuid: 'staff-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: vi.fn(async (entity) => ({
        ...entity,
        id: entity.id ?? 1,
        uuid: entity.uuid ?? 'staff-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockUserRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ ...dto, id: 10 })),
      save: vi.fn(async (entity) => ({ ...entity, id: 10 })),
    };

    mockRoleRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ ...dto, id: 1 })),
      save: vi.fn(async (entity) => ({ ...entity, id: 1 })),
    };

    mockClassRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    service = new StaffService(
      mockStaffRepo,
      mockUserRepo,
      mockRoleRepo,
      mockClassRepo,
      mockLogger,
    );
  });

  it('should find all staff with pagination', async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      withDeleted: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            uuid: 'uuid-1',
            staffCode: 'STF-0001',
            name: 'John Doe',
            department: StaffDepartmentEnum.ACADEMIC,
            designation: 'Teacher',
            salaryType: StaffSalaryTypeEnum.HOURLY,
            hourlyRate: 15,
            baseSalary: 0,
            status: StaffStatusEnum.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        1,
      ]),
    };
    mockStaffRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await service.findAll({ page: 1, pageSize: 10 });
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe('John Doe');
    expect(result[1]).toBe(1);
  });

  it('should create a new staff member with hourly salary', async () => {
    mockStaffRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.id) {
        return {
          id: 1,
          uuid: 'uuid-1',
          staffCode: 'STF-0001',
          name: 'John Doe',
          department: StaffDepartmentEnum.ACADEMIC,
          designation: 'Teacher',
          salaryType: StaffSalaryTypeEnum.HOURLY,
          hourlyRate: 15,
          baseSalary: 0,
          status: StaffStatusEnum.ACTIVE,
        };
      }
      return null;
    });

    const result = await service.create({
      name: 'John Doe',
      department: StaffDepartmentEnum.ACADEMIC,
      designation: 'Teacher',
      salaryType: StaffSalaryTypeEnum.HOURLY,
      hourlyRate: 15,
    });

    expect(result.name).toBe('John Doe');
    expect(result.hourlyRate).toBe(15);
  });

  it('should create a staff member with monthly salary', async () => {
    mockStaffRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.id) {
        return {
          id: 2,
          uuid: 'uuid-2',
          staffCode: 'STF-0002',
          name: 'Vannak Meas',
          department: StaffDepartmentEnum.MANAGEMENT,
          designation: 'Principal',
          salaryType: StaffSalaryTypeEnum.MONTHLY,
          baseSalary: 1200,
          hourlyRate: 0,
          status: StaffStatusEnum.ACTIVE,
        };
      }
      return null;
    });

    const result = await service.create({
      name: 'Vannak Meas',
      department: StaffDepartmentEnum.MANAGEMENT,
      designation: 'Principal',
      salaryType: StaffSalaryTypeEnum.MONTHLY,
      baseSalary: 1200,
    });

    expect(result.name).toBe('Vannak Meas');
    expect(result.baseSalary).toBe(1200);
  });

  it('should throw ConflictException on duplicate staffCode', async () => {
    mockStaffRepo.findOne.mockResolvedValue({ id: 99, staffCode: 'STF-DUPE' });

    await expect(
      service.create({
        name: 'Dupe Code',
        staffCode: 'STF-DUPE',
        designation: 'Staff',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should update an existing staff member', async () => {
    mockStaffRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        uuid: 'uuid-1',
        name: 'Old Name',
        department: StaffDepartmentEnum.ACADEMIC,
        designation: 'Teacher',
        salaryType: StaffSalaryTypeEnum.HOURLY,
        hourlyRate: 12,
      })
      .mockResolvedValueOnce({
        id: 1,
        uuid: 'uuid-1',
        name: 'Updated Name',
        department: StaffDepartmentEnum.ACADEMIC,
        designation: 'Senior Teacher',
        salaryType: StaffSalaryTypeEnum.HOURLY,
        hourlyRate: 18,
      });

    const result = await service.update(1, {
      name: 'Updated Name',
      designation: 'Senior Teacher',
      hourlyRate: 18,
    });

    expect(result.name).toBe('Updated Name');
    expect(result.hourlyRate).toBe(18);
  });

  it('should throw NotFoundException when updating non-existent staff', async () => {
    mockStaffRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update(999, { name: 'Non Existent' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should soft delete staff member', async () => {
    mockStaffRepo.findOne.mockResolvedValue({
      id: 1,
      uuid: 'uuid-1',
      name: 'Delete Me',
      department: StaffDepartmentEnum.ACADEMIC,
      designation: 'Teacher',
    });

    const result = await service.remove(1);
    expect(result.name).toBe('Delete Me');
    expect(mockStaffRepo.softDelete).toHaveBeenCalledWith(1);
  });
});
