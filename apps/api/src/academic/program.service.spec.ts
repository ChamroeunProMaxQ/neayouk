import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProgramService } from './program.service.js';

describe('ProgramService', () => {
  let service: ProgramService;
  let mockProgramRepo: any;

  beforeEach(() => {
    mockProgramRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'prog-uuid-1', ...dto })),
      save: vi.fn((entity) => Promise.resolve({ id: entity.id || 1, ...entity })),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    service = new ProgramService(mockProgramRepo);
  });

  // 1. Happy Path
  describe('Happy Path (200/201 Success)', () => {
    it('should create a new program with grade levels', async () => {
      mockProgramRepo.findOne.mockResolvedValue(null);

      const dto = {
        name: 'Primary',
        code: 'PRI',
        gradeLevels: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
        status: 'ACTIVE' as const,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Primary');
      expect(result.code).toBe('PRI');
      expect(mockProgramRepo.save).toHaveBeenCalled();
    });

    it('should find one program by ID', async () => {
      const mockProgram = {
        id: 1,
        name: 'Primary',
        code: 'PRI',
        classes: [{ id: 1, name: 'Grade 1A' }],
      };
      mockProgramRepo.findOne.mockResolvedValue(mockProgram);

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Primary');
      expect(mockProgramRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['classes'],
      });
    });

    it('should update an existing program', async () => {
      const existing = {
        id: 1,
        name: 'Primary',
        code: 'PRI',
      };
      mockProgramRepo.findOne.mockResolvedValue(existing);

      const updateDto = {
        name: 'Primary Education',
      };

      const result = await service.update(1, updateDto);
      expect(result.name).toBe('Primary Education');
      expect(mockProgramRepo.save).toHaveBeenCalled();
    });

    it('should query all programs with pagination and filters', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([
          [
            { id: 1, name: 'Primary', code: 'PRI', classes: [] },
            { id: 2, name: 'Language', code: 'LANG', classes: [] },
          ],
          2,
        ]),
      };
      mockProgramRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll({
        search: 'Primary',
        status: 'ACTIVE',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(result[0].length).toBe(2);
      expect(result[1]).toBe(2);
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('program.name', 'ASC');
    });

    it('should soft delete a program', async () => {
      mockProgramRepo.findOne.mockResolvedValue({ id: 1, code: 'PRI', classes: [] });

      const result = await service.delete(1);
      expect(result.success).toBe(true);
      expect(mockProgramRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  // 2. Conflict Handling (409 Conflict)
  describe('Conflict Handling (409 Duplicate Code)', () => {
    it('should throw ConflictException when creating a program with duplicate code', async () => {
      mockProgramRepo.findOne.mockResolvedValue({ id: 2, code: 'PRI' });

      await expect(
        service.create({
          name: 'Primary Dup',
          code: 'PRI',
          gradeLevels: [],
          status: 'ACTIVE',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when updating program code to another existing code', async () => {
      mockProgramRepo.findOne
        .mockResolvedValueOnce({ id: 1, code: 'PRI' }) // for findOne(1)
        .mockResolvedValueOnce({ id: 2, code: 'LANG' }); // for duplicate check

      await expect(
        service.update(1, {
          code: 'LANG',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 3. Resource Not Found (404 NotFoundException)
  describe('Resource Not Found (404 Not Found)', () => {
    it('should throw NotFoundException when finding non-existent program', async () => {
      mockProgramRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when updating non-existent program', async () => {
      mockProgramRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deleting non-existent program', async () => {
      mockProgramRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  // 4. Edge & Boundary Limits
  describe('Edge & Boundary Limits', () => {
    it('should handle creating program with empty grade levels', async () => {
      mockProgramRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        name: 'Special Program',
        code: 'SPEC',
        gradeLevels: [],
        status: 'ACTIVE',
      });

      expect(result).toBeDefined();
      expect(mockProgramRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gradeLevels: [],
        }),
      );
    });
  });
});
