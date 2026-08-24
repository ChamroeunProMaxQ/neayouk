import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExaminationService } from './examination.service.js';
import { GradebookMapper } from './mapper/gradebook.mapper.js';
import { DefaultGradingComponents, DefaultGradeScale } from '@repo/contracts';

describe('ExaminationService & Gradebook Engine', () => {
  let service: ExaminationService;
  let mockScoreRepo: any;
  let mockClassRepo: any;
  let mockStudentRepo: any;
  let mockStudentClassRepo: any;
  let mockGradingRuleService: any;
  let mockDataSource: any;
  let mockQueryRunner: any;

  const mockGradingRule = {
    id: 1,
    uuid: 'rule-uuid-1',
    name: 'Standard Scheme',
    code: 'RULE-DEFAULT',
    components: DefaultGradingComponents,
    gradeScale: DefaultGradeScale,
    isDefault: true,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    mockScoreRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(),
    };

    mockClassRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Grade 1A',
        code: 'G1-A',
        gradeLevel: '1',
        academicYear: '2025-2026',
        semester: 'SEMESTER_1',
      }),
    };

    mockStudentRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 10,
        studentCode: 'STU-0010',
        firstName: 'Sokha',
        lastName: 'Chan',
        gender: 'MALE',
      }),
    };

    mockStudentClassRepo = {
      find: vi.fn().mockResolvedValue([
        {
          id: 1,
          studentId: 10,
          classId: 1,
          status: 'ENROLLED',
          student: {
            id: 10,
            studentCode: 'STU-0010',
            firstName: 'Sokha',
            lastName: 'Chan',
            gender: 'MALE',
          },
        },
        {
          id: 2,
          studentId: 11,
          classId: 1,
          status: 'ENROLLED',
          student: {
            id: 11,
            studentCode: 'STU-0011',
            firstName: 'Dara',
            lastName: 'Keo',
            gender: 'MALE',
          },
        },
      ]),
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        studentId: 10,
        classId: 1,
        status: 'ENROLLED',
      }),
    };

    mockGradingRuleService = {
      findDefault: vi.fn().mockResolvedValue(mockGradingRule),
    };

    mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
    };

    mockDataSource = {
      createQueryRunner: vi.fn(() => mockQueryRunner),
    };

    service = new ExaminationService(
      mockScoreRepo,
      mockClassRepo,
      mockStudentRepo,
      mockStudentClassRepo,
      mockGradingRuleService,
      mockDataSource,
    );
  });

  describe('1. Happy Path (200/201 Success)', () => {
    it('should retrieve gradebook matrix with student roster and statistics', async () => {
      const result = await service.getGradebookMatrix(1, '2026-08');

      expect(result).toBeDefined();
      expect(result.classId).toBe(1);
      expect(result.className).toBe('Grade 1A');
      expect(result.month).toBe('2026-08');
      expect(result.rows).toHaveLength(2);
      expect(result.classStats.totalStudents).toBe(2);
    });

    it('should batch save gradebook scores in a database transaction', async () => {
      const saveDto = {
        classId: 1,
        month: '2026-08',
        scores: [
          {
            studentId: 10,
            scores: { reading: 10, vocab: 30, grammar: 20, listening: 20, speaking: 10, homework: 10 },
            feedback: 'Perfect performance!',
          },
          {
            studentId: 11,
            scores: { reading: 8, vocab: 24, grammar: 16, listening: 16, speaking: 8, homework: 8 },
            feedback: 'Very good effort.',
          },
        ],
      };

      const result = await service.saveGradebook(saveDto, 1);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should generate printable student report card', async () => {
      const report = await service.getStudentReportCard(10, '2026-08', 1);

      expect(report).toBeDefined();
      expect(report.studentId).toBe(10);
      expect(report.studentCode).toBe('STU-0010');
      expect(report.components).toHaveLength(6);
    });

    it('should export formatted CSV string', async () => {
      const csv = await service.exportCsv(1, '2026-08');
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Student ID');
      expect(csv).toContain('Total Raw Score');
      expect(csv).toContain('Rank');
    });
  });

  describe('2. Validation Failures (400 Bad Request)', () => {
    it('should throw BadRequestException if a raw score exceeds component maxScore', async () => {
      const invalidDto = {
        classId: 1,
        month: '2026-08',
        scores: [
          {
            studentId: 10,
            scores: { reading: 25 }, // Reading maxScore is 10!
          },
        ],
      };

      await expect(service.saveGradebook(invalidDto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Resource Not Found (404)', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      mockClassRepo.findOne.mockResolvedValue(null);

      await expect(service.getGradebookMatrix(999, '2026-08')).rejects.toThrow(NotFoundException);
      await expect(
        service.saveGradebook({ classId: 999, month: '2026-08', scores: [] }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if student does not exist for report card', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudentReportCard(999, '2026-08')).rejects.toThrow(NotFoundException);
    });
  });

  describe('4. Score Calculation & Ranking Engine Unit Logic', () => {
    it('should calculate perfect 100% score as Grade A', () => {
      const scores = { reading: 10, vocab: 30, grammar: 20, listening: 20, speaking: 10, homework: 10 };
      const res = GradebookMapper.calculateScores(scores, DefaultGradingComponents, DefaultGradeScale);

      expect(res.totalRawScore).toBe(100);
      expect(res.totalWeightedScore).toBe(100);
      expect(res.percentage).toBe(100);
      expect(res.gradeLetter).toBe('A');
    });

    it('should calculate 0% score as Grade F', () => {
      const scores = { reading: 0, vocab: 0, grammar: 0, listening: 0, speaking: 0, homework: 0 };
      const res = GradebookMapper.calculateScores(scores, DefaultGradingComponents, DefaultGradeScale);

      expect(res.totalRawScore).toBe(0);
      expect(res.totalWeightedScore).toBe(0);
      expect(res.percentage).toBe(0);
      expect(res.gradeLetter).toBe('F');
    });

    it('should correctly handle rank ties (two Rank 1s share Rank 1, next is Rank 3)', () => {
      const rows: any[] = [
        { studentId: 1, percentage: 95 },
        { studentId: 2, percentage: 95 },
        { studentId: 3, percentage: 80 },
        { studentId: 4, percentage: 70 },
      ];

      const ranked = GradebookMapper.assignRanks(rows);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[2].rank).toBe(3);
      expect(ranked[3].rank).toBe(4);
    });
  });
});
