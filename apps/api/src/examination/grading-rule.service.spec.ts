import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { GradingRuleService } from './grading-rule.service.js';
import { DefaultGradingComponents, DefaultGradeScale } from '@repo/contracts';

describe('GradingRuleService', () => {
  let service: GradingRuleService;
  let mockRuleRepo: any;

  beforeEach(() => {
    mockRuleRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'rule-uuid-1', ...dto })),
      save: vi.fn((entity) => Promise.resolve({ id: entity.id || 1, ...entity })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    service = new GradingRuleService(mockRuleRepo);
  });

  describe('1. Happy Path (200/201 Success)', () => {
    it('should create a valid master grading rule', async () => {
      mockRuleRepo.findOne.mockResolvedValue(null);

      const dto = {
        name: 'Standard Scheme',
        code: 'RULE-STD',
        components: DefaultGradingComponents,
        gradeScale: DefaultGradeScale,
        isDefault: true,
        status: 'ACTIVE',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.code).toBe('RULE-STD');
      expect(result.components).toHaveLength(6);
      expect(mockRuleRepo.save).toHaveBeenCalled();
    });

    it('should find default grading rule', async () => {
      const mockRule = {
        id: 1,
        uuid: 'rule-uuid-1',
        name: 'Default Scheme',
        code: 'RULE-DEFAULT',
        components: DefaultGradingComponents,
        gradeScale: DefaultGradeScale,
        isDefault: true,
        status: 'ACTIVE',
      };
      mockRuleRepo.findOne.mockResolvedValue(mockRule);

      const result = await service.findDefault();
      expect(result.id).toBe(1);
      expect(result.code).toBe('RULE-DEFAULT');
    });
  });

  describe('2. Validation Failures (400 Bad Request)', () => {
    it('should throw BadRequestException if component weights sum is not 100%', async () => {
      const invalidComponents = [
        { id: 'reading', name: 'Reading', maxScore: 10, weight: 10 },
        { id: 'vocab', name: 'Vocab', maxScore: 30, weight: 30 },
      ]; // Sum = 40%

      const dto = {
        name: 'Invalid Scheme',
        code: 'RULE-INV',
        components: invalidComponents,
        gradeScale: DefaultGradeScale,
        isDefault: false,
        status: 'ACTIVE',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Duplicate & Uniqueness Conflicts (409 Conflict)', () => {
    it('should throw ConflictException if rule code already exists', async () => {
      mockRuleRepo.findOne.mockResolvedValue({ id: 99, code: 'RULE-EXISTS' });

      const dto = {
        name: 'Duplicate Scheme',
        code: 'RULE-EXISTS',
        components: DefaultGradingComponents,
        gradeScale: DefaultGradeScale,
        isDefault: false,
        status: 'ACTIVE',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('4. Resource Not Found (404)', () => {
    it('should throw NotFoundException if rule ID does not exist', async () => {
      mockRuleRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, { name: 'Updated' })).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Edge & Boundary Cases', () => {
    it('should allow single component with 100% weight', async () => {
      mockRuleRepo.findOne.mockResolvedValue(null);

      const singleComp = [
        { id: 'final_exam', name: 'Final Exam', maxScore: 100, weight: 100 },
      ];

      const dto = {
        name: 'Single Exam Scheme',
        code: 'RULE-SINGLE',
        components: singleComp,
        gradeScale: DefaultGradeScale,
        isDefault: false,
        status: 'ACTIVE',
      };

      const result = await service.create(dto);
      expect(result.components).toHaveLength(1);
      expect(result.components[0].weight).toBe(100);
    });
  });
});
