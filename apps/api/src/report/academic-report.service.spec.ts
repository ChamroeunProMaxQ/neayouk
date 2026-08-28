import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcademicReportService } from './academic-report.service.js';

describe('AcademicReportService (Unit)', () => {
  let service: AcademicReportService;
  let mockScoreRepo: any;
  let mockClassRepo: any;
  let mockStudentRepo: any;
  let mockGradingRuleRepo: any;

  beforeEach(() => {
    mockScoreRepo = {
      createQueryBuilder: vi.fn(),
    };
    mockClassRepo = {
      findOne: vi.fn(),
    };
    mockStudentRepo = {
      findOne: vi.fn(),
    };
    mockGradingRuleRepo = {
      findOne: vi.fn(),
    };

    service = new AcademicReportService(
      mockScoreRepo,
      mockClassRepo,
      mockStudentRepo,
      mockGradingRuleRepo,
    );
  });

  it('should calculate academic summary statistics and subject mastery', async () => {
    const mockScores = [
      {
        id: 1,
        studentId: 101,
        classId: 1,
        percentage: 85,
        gradeLetter: 'A',
        totalRawScore: 340,
        rank: 1,
        scores: { math: 90, english: 80, khmer: 85, science: 85 },
        student: { id: 101, studentCode: 'STU-101', firstName: 'Dara', lastName: 'Kim' },
        class: { id: 1, name: 'Grade 10-A', gradeLevel: 10 },
      },
      {
        id: 2,
        studentId: 102,
        classId: 1,
        percentage: 45,
        gradeLetter: 'F',
        totalRawScore: 180,
        rank: 2,
        scores: { math: 40, english: 50, khmer: 45, science: 45 },
        student: { id: 102, studentCode: 'STU-102', firstName: 'Bona', lastName: 'Seng' },
        class: { id: 1, name: 'Grade 10-A', gradeLevel: 10 },
      },
    ];

    const mockRule = {
      id: 1,
      isDefault: true,
      components: [
        { id: 'math', name: 'Mathematics', maxScore: 100, weight: 25 },
        { id: 'english', name: 'English Language', maxScore: 100, weight: 25 },
        { id: 'khmer', name: 'Khmer Literature', maxScore: 100, weight: 25 },
        { id: 'science', name: 'Science', maxScore: 100, weight: 25 },
      ],
    };

    const mockQb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(mockScores),
    };

    mockScoreRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockGradingRuleRepo.findOne.mockResolvedValue(mockRule);

    const result = await service.getSummary({ academicYear: '2025-2026' });

    expect(result.totalStudentsAssessed).toBe(2);
    expect(result.overallAverageScore).toBe(65); // (85 + 45) / 2
    expect(result.passRate).toBe(50); // 1 out of 2 passed
    expect(result.honorRollCount).toBe(1);
    expect(result.atRiskCount).toBe(1);
    expect(result.topPerformers.length).toBe(2);
    expect(result.topPerformers[0].studentName).toBe('Kim Dara');
    expect(result.atRiskStudents.length).toBe(1);
    expect(result.atRiskStudents[0].studentName).toBe('Seng Bona');
    expect(result.subjectMastery.length).toBe(4);
  });
});
