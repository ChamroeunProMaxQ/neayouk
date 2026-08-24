import type {
  GradingRuleComponent,
  GradeScaleItem,
  GradebookMatrixRow,
  ClassGradeStatsDto,
  StudentScoreAttribute,
} from '@repo/contracts';
import { StudentScore } from '../entity/student-score.entity.js';

export interface ScoreCalculationResult {
  totalRawScore: number;
  totalWeightedScore: number;
  percentage: number;
  gradeLetter: string;
}

export class GradebookMapper {
  static calculateScores(
    rawScores: Record<string, number>,
    components: GradingRuleComponent[],
    gradeScale: GradeScaleItem[],
  ): ScoreCalculationResult {
    let totalRawScore = 0;
    let totalWeightedScore = 0;

    for (const comp of components) {
      const raw = Number(rawScores[comp.id] ?? 0);
      const clampedRaw = Math.max(0, raw);
      totalRawScore += clampedRaw;

      if (comp.maxScore > 0) {
        const compWeighted = (clampedRaw / comp.maxScore) * comp.weight;
        totalWeightedScore += compWeighted;
      }
    }

    const percentage = Number(totalWeightedScore.toFixed(2));
    let gradeLetter = 'F';

    // Match against gradeScale (assumed sorted or check ranges)
    for (const scale of gradeScale) {
      if (percentage >= scale.minScore && percentage <= scale.maxScore) {
        gradeLetter = scale.letter;
        break;
      }
    }

    return {
      totalRawScore: Number(totalRawScore.toFixed(2)),
      totalWeightedScore: percentage,
      percentage,
      gradeLetter,
    };
  }

  static assignRanks(rows: GradebookMatrixRow[]): GradebookMatrixRow[] {
    // Sort descending by percentage
    const sorted = [...rows].sort((a, b) => b.percentage - a.percentage);

    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].percentage === sorted[i - 1].percentage) {
        sorted[i].rank = sorted[i - 1].rank;
      } else {
        sorted[i].rank = currentRank;
      }
      currentRank = i + 2;
    }

    // Map back to original order or keep sorted
    return sorted;
  }

  static calculateClassStats(rows: GradebookMatrixRow[]): ClassGradeStatsDto {
    const totalStudents = rows.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        gradedCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        gradeDistribution: {},
      };
    }

    let totalScoreSum = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passCount = 0;
    let failCount = 0;
    let gradedCount = 0;
    const gradeDistribution: Record<string, number> = {};

    for (const row of rows) {
      const p = row.percentage;
      totalScoreSum += p;
      if (p > highestScore) highestScore = p;
      if (p < lowestScore) lowestScore = p;

      if (Object.keys(row.scores).length > 0 && p > 0) {
        gradedCount++;
      }

      if (p >= 50) {
        passCount++;
      } else {
        failCount++;
      }

      const letter = row.gradeLetter || 'F';
      gradeDistribution[letter] = (gradeDistribution[letter] || 0) + 1;
    }

    if (lowestScore === 100 && totalStudents > 0 && highestScore === 0) {
      lowestScore = 0;
    }

    const averageScore = Number((totalScoreSum / totalStudents).toFixed(2));
    const passRate = Number(((passCount / totalStudents) * 100).toFixed(2));

    return {
      totalStudents,
      gradedCount,
      averageScore,
      highestScore: Number(highestScore.toFixed(2)),
      lowestScore: Number(lowestScore.toFixed(2)),
      passCount,
      failCount,
      passRate,
      gradeDistribution,
    };
  }

  static toDto(entity: StudentScore): StudentScoreAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      studentId: entity.studentId,
      classId: entity.classId,
      month: entity.month,
      academicYear: entity.academicYear,
      semester: entity.semester,
      scores: entity.scores ?? {},
      totalRawScore: Number(entity.totalRawScore || 0),
      totalWeightedScore: Number(entity.totalWeightedScore || 0),
      percentage: Number(entity.percentage || 0),
      gradeLetter: entity.gradeLetter || 'F',
      rank: entity.rank,
      feedback: entity.feedback,
      recordedBy: entity.recordedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
