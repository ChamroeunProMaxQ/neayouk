import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  type AcademicReportQueryDto,
  type AcademicReportSummaryDto,
} from '@repo/contracts';
import { StudentScore } from '@src/examination/entity/student-score.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { GradingRule } from '@src/examination/entity/grading-rule.entity.js';
import {
  applyBranchScoping,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class AcademicReportService {
  constructor(
    @InjectRepository(StudentScore)
    private readonly scoreRepo: Repository<StudentScore>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(GradingRule)
    private readonly gradingRuleRepo: Repository<GradingRule>,
  ) {}

  async getSummary(
    query: AcademicReportQueryDto,
    currentUser?: AuthContext,
  ): Promise<AcademicReportSummaryDto> {
    const qb = this.scoreRepo
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .leftJoinAndSelect('score.class', 'class')
      .where('score.deleted_at IS NULL');

    applyBranchScoping(qb, 'score', currentUser, (query as any).branchId);

    if (query.academicYear) {
      qb.andWhere('score.academic_year = :year', { year: query.academicYear });
    }
    if (query.semester) {
      qb.andWhere('score.semester = :sem', { sem: query.semester });
    }
    if (query.month) {
      qb.andWhere('score.month = :month', { month: query.month });
    }
    if (query.classId) {
      qb.andWhere('score.class_id = :classId', { classId: query.classId });
    }

    const scores = await qb.getMany();

    // Default grading rule for component weights
    const defaultRule = await this.gradingRuleRepo.findOne({
      where: { isDefault: true, deletedAt: IsNull() },
    });

    const totalStudentsAssessed = scores.length;
    const overallTotalPercent = scores.reduce((sum, s) => sum + Number(s.percentage || 0), 0);
    const overallAverageScore =
      totalStudentsAssessed > 0 ? Number((overallTotalPercent / totalStudentsAssessed).toFixed(1)) : 0;

    const passingScores = scores.filter((s) => s.gradeLetter !== 'F' && Number(s.percentage || 0) >= 50);
    const passRate =
      totalStudentsAssessed > 0
        ? Number(((passingScores.length / totalStudentsAssessed) * 100).toFixed(1))
        : 0;

    const honorRoll = scores.filter((s) => s.gradeLetter === 'A' || s.gradeLetter === 'B');
    const honorRollCount = honorRoll.length;
    const honorRollPercentage =
      totalStudentsAssessed > 0
        ? Number(((honorRollCount / totalStudentsAssessed) * 100).toFixed(1))
        : 0;

    const atRisk = scores.filter((s) => s.gradeLetter === 'F' || Number(s.percentage || 0) < 50);
    const atRiskCount = atRisk.length;
    const atRiskPercentage =
      totalStudentsAssessed > 0
        ? Number(((atRiskCount / totalStudentsAssessed) * 100).toFixed(1))
        : 0;

    // Grade distribution
    const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    scores.forEach((s) => {
      const g = (s.gradeLetter || 'F').toUpperCase();
      if (gradeCounts[g] !== undefined) {
        gradeCounts[g] += 1;
      } else {
        gradeCounts.F += 1;
      }
    });

    const gradeDistribution = Object.entries(gradeCounts).map(([gradeLetter, count]) => ({
      gradeLetter,
      count,
      percentage:
        totalStudentsAssessed > 0
          ? Number(((count / totalStudentsAssessed) * 100).toFixed(1))
          : 0,
    }));

    // Subject mastery analysis
    const components = defaultRule?.components || [
      { id: 'math', name: 'Mathematics', maxScore: 100, weight: 25 },
      { id: 'english', name: 'English Language', maxScore: 100, weight: 25 },
      { id: 'khmer', name: 'Khmer Literature', maxScore: 100, weight: 25 },
      { id: 'science', name: 'Science', maxScore: 100, weight: 25 },
    ];

    const subjectStatsMap = new Map<string, { totalScore: number; count: number; passingCount: number }>();
    components.forEach((c) => {
      subjectStatsMap.set(c.id, { totalScore: 0, count: 0, passingCount: 0 });
    });

    scores.forEach((s) => {
      const rawScores = typeof s.scores === 'string' ? JSON.parse(s.scores) : s.scores || {};
      components.forEach((c) => {
        const raw = rawScores[c.id];
        if (raw !== undefined && raw !== null) {
          const stat = subjectStatsMap.get(c.id)!;
          stat.totalScore += Number(raw);
          stat.count += 1;
          if (Number(raw) >= (c.maxScore * 0.5)) {
            stat.passingCount += 1;
          }
        }
      });
    });

    const subjectMastery = components.map((c) => {
      const stat = subjectStatsMap.get(c.id)!;
      const averageScore = stat.count > 0 ? Number((stat.totalScore / stat.count).toFixed(1)) : 0;
      const averagePercentage =
        c.maxScore > 0 ? Number(((averageScore / c.maxScore) * 100).toFixed(1)) : 0;
      return {
        subjectId: c.id,
        subjectName: c.name,
        maxScore: c.maxScore,
        averageScore,
        averagePercentage,
        passingCount: stat.passingCount,
      };
    });

    // Class Benchmarks
    const classGroups = new Map<number, { classEntity: Class; scores: StudentScore[] }>();
    scores.forEach((s) => {
      if (s.class) {
        if (!classGroups.has(s.classId)) {
          classGroups.set(s.classId, { classEntity: s.class, scores: [] });
        }
        classGroups.get(s.classId)!.scores.push(s);
      }
    });

    const classBenchmarks = Array.from(classGroups.values()).map(({ classEntity, scores: classScores }) => {
      const totalInClass = classScores.length;
      const totalPercentInClass = classScores.reduce((sum, cs) => sum + Number(cs.percentage || 0), 0);
      const averageScore =
        totalInClass > 0 ? Number((totalPercentInClass / totalInClass).toFixed(1)) : 0;
      const passInClass = classScores.filter((cs) => cs.gradeLetter !== 'F' && Number(cs.percentage || 0) >= 50).length;
      const passRateInClass =
        totalInClass > 0 ? Number(((passInClass / totalInClass) * 100).toFixed(1)) : 0;

      const percents = classScores.map((cs) => Number(cs.percentage || 0));
      const highestScore = percents.length > 0 ? Math.max(...percents) : 0;
      const lowestScore = percents.length > 0 ? Math.min(...percents) : 0;

      return {
        classId: classEntity.id,
        className: classEntity.name,
        gradeLevel: classEntity.gradeLevel ?? null,
        totalStudents: totalInClass,
        averageScore,
        passRate: passRateInClass,
        highestScore,
        lowestScore,
      };
    });

    // Top Performers (Top 10 sorted by percentage DESC)
    const sortedByScore = [...scores].sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));
    const topPerformers = sortedByScore.slice(0, 10).map((s, index) => ({
      studentId: s.studentId,
      studentCode: s.student?.studentCode ?? null,
      studentName: s.student ? `${s.student.lastName} ${s.student.firstName}` : `Student #${s.studentId}`,
      studentNameKm: s.student?.firstNameKm && s.student?.lastNameKm ? `${s.student.lastNameKm} ${s.student.firstNameKm}` : null,
      className: s.class?.name || 'Class',
      totalScore: Number(s.totalRawScore || 0),
      percentage: Number(s.percentage || 0),
      gradeLetter: s.gradeLetter || 'A',
      rank: s.rank || (index + 1),
    }));

    // At-Risk Students (Sorted by percentage ASC, max 15)
    const atRiskStudents = atRisk
      .sort((a, b) => Number(a.percentage || 0) - Number(b.percentage || 0))
      .slice(0, 15)
      .map((s) => ({
        studentId: s.studentId,
        studentCode: s.student?.studentCode ?? null,
        studentName: s.student ? `${s.student.lastName} ${s.student.firstName}` : `Student #${s.studentId}`,
        studentNameKm: s.student?.firstNameKm && s.student?.lastNameKm ? `${s.student.lastNameKm} ${s.student.firstNameKm}` : null,
        className: s.class?.name || 'Class',
        totalScore: Number(s.totalRawScore || 0),
        percentage: Number(s.percentage || 0),
        gradeLetter: s.gradeLetter || 'F',
        feedback: s.feedback ?? null,
      }));

    return {
      totalStudentsAssessed,
      overallAverageScore,
      passRate,
      honorRollCount,
      honorRollPercentage,
      atRiskCount,
      atRiskPercentage,
      gradeDistribution,
      subjectMastery,
      classBenchmarks,
      topPerformers,
      atRiskStudents,
    };
  }

  async exportCsv(
    query: AcademicReportQueryDto,
    currentUser?: AuthContext,
  ): Promise<string> {
    const qb = this.scoreRepo
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .leftJoinAndSelect('score.class', 'class')
      .where('score.deleted_at IS NULL')
      .orderBy('score.percentage', 'DESC');

    applyBranchScoping(qb, 'score', currentUser, (query as any).branchId);

    if (query.academicYear) {
      qb.andWhere('score.academic_year = :year', { year: query.academicYear });
    }
    if (query.semester) {
      qb.andWhere('score.semester = :sem', { sem: query.semester });
    }
    if (query.classId) {
      qb.andWhere('score.class_id = :classId', { classId: query.classId });
    }

    const scores = await qb.getMany();

    const headers = [
      'Rank',
      'Student Code',
      'Student Name (EN)',
      'Student Name (KM)',
      'Gender',
      'Class',
      'Academic Year',
      'Semester',
      'Month',
      'Total Raw Score',
      'Percentage (%)',
      'Grade',
      'Feedback / Notes',
    ];

    const rows = scores.map((s, idx) => [
      String(s.rank || idx + 1),
      s.student?.studentCode || `STU-${s.studentId}`,
      s.student ? `${s.student.lastName} ${s.student.firstName}` : '',
      s.student?.firstNameKm && s.student?.lastNameKm ? `${s.student.lastNameKm} ${s.student.firstNameKm}` : '',
      s.student?.gender || 'MALE',
      s.class?.name || '',
      s.academicYear || '',
      s.semester || '',
      s.month || '',
      String(s.totalRawScore || 0),
      String(s.percentage || 0),
      s.gradeLetter || 'F',
      s.feedback || '',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
