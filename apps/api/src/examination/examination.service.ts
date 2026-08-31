import { randomUUID } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import {
  ClassEnrollmentStatusEnum,
  type GradebookMatrixDto,
  type BatchSaveGradebookDto,
  type StudentReportCardDto,
  type GradebookMatrixRow,
} from '@repo/contracts';
import { StudentScore } from './entity/student-score.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { GradingRuleService } from './grading-rule.service.js';
import { GradebookMapper } from './mapper/gradebook.mapper.js';

@Injectable()
export class ExaminationService {
  constructor(
    @InjectRepository(StudentScore)
    private readonly scoreRepo: Repository<StudentScore>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,
    private readonly gradingRuleService: GradingRuleService,
    private readonly dataSource: DataSource,
  ) {}

  async getGradebookMatrix(classId: number, month: string): Promise<GradebookMatrixDto> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId, deletedAt: IsNull() },
      relations: ['teacher'],
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const gradingRule = await this.gradingRuleService.findDefault();

    // Fetch enrolled students
    const enrollments = await this.studentClassRepo.find({
      where: {
        classId,
        status: ClassEnrollmentStatusEnum.ENROLLED,
      },
      relations: ['student'],
      order: { id: 'ASC' },
    });

    const enrolledStudents = enrollments
      .map((e) => e.student)
      .filter((s): s is Student => Boolean(s && !s.deletedAt));

    // Fetch existing scores for (classId, month)
    const existingScores = await this.scoreRepo.find({
      where: { classId, month, deletedAt: IsNull() },
    });
    const scoreMap = new Map<number, StudentScore>();
    for (const sc of existingScores) {
      scoreMap.set(sc.studentId, sc);
    }

    // Build row items
    const rows: GradebookMatrixRow[] = [];
    for (const student of enrolledStudents) {
      const savedScore = scoreMap.get(student.id);
      const rawScores = savedScore?.scores ?? {};

      const calc = GradebookMapper.calculateScores(
        rawScores,
        gradingRule.components,
        gradingRule.gradeScale,
      );

      rows.push({
        studentId: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        firstNameKm: student.firstNameKm,
        lastNameKm: student.lastNameKm,
        gender: student.gender || 'MALE',
        scores: rawScores,
        totalRawScore: calc.totalRawScore,
        totalWeightedScore: calc.totalWeightedScore,
        percentage: calc.percentage,
        gradeLetter: calc.gradeLetter,
        rank: savedScore?.rank ?? null,
        feedback: savedScore?.feedback ?? null,
      });
    }

    const rankedRows = GradebookMapper.assignRanks(rows);
    const classStats = GradebookMapper.calculateClassStats(rankedRows);

    const teacherName = classEntity.teacher ? classEntity.teacher.name : null;

    return {
      classId: classEntity.id,
      className: classEntity.name,
      classCode: classEntity.code,
      gradeLevel: classEntity.gradeLevel,
      teacherName,
      month,
      academicYear: classEntity.academicYear || '2025-2026',
      semester: classEntity.semester || 'SEMESTER_1',
      gradingRule,
      rows: rankedRows,
      classStats,
    };
  }

  async saveGradebook(
    dto: BatchSaveGradebookDto,
    userId?: number,
  ): Promise<GradebookMatrixDto> {
    const classEntity = await this.classRepo.findOne({
      where: { id: dto.classId, deletedAt: IsNull() },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${dto.classId} not found`);
    }

    const gradingRule = await this.gradingRuleService.findDefault();
    const academicYear = classEntity.academicYear || '2025-2026';
    const semester = classEntity.semester || 'SEMESTER_1';

    // Validate raw scores against maxScore
    for (const item of dto.scores) {
      for (const comp of gradingRule.components) {
        const raw = item.scores[comp.id];
        if (raw !== undefined && raw > comp.maxScore) {
          throw new BadRequestException(
            `Score ${raw} for ${comp.name} exceeds max allowed score of ${comp.maxScore}`,
          );
        }
      }
    }

    // Precalculate scores and ranks
    const calculatedItems = dto.scores.map((item) => {
      const calc = GradebookMapper.calculateScores(
        item.scores,
        gradingRule.components,
        gradingRule.gradeScale,
      );
      return {
        studentId: item.studentId,
        scores: item.scores,
        totalRawScore: calc.totalRawScore,
        totalWeightedScore: calc.totalWeightedScore,
        percentage: calc.percentage,
        gradeLetter: calc.gradeLetter,
        feedback: item.feedback ?? null,
        rank: 0,
      };
    });

    // Compute ranks
    calculatedItems.sort((a, b) => b.percentage - a.percentage);
    let currentRank = 1;
    for (let i = 0; i < calculatedItems.length; i++) {
      if (i > 0 && calculatedItems[i].percentage === calculatedItems[i - 1].percentage) {
        calculatedItems[i].rank = calculatedItems[i - 1].rank;
      } else {
        calculatedItems[i].rank = currentRank;
      }
      currentRank = i + 2;
    }

    // Persist in database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of calculatedItems) {
        await queryRunner.query(
          `
          INSERT INTO student_scores (
            uuid, branch_id, student_id, class_id, month, academic_year, semester,
            scores, total_raw_score, total_weighted_score, percentage,
            grade_letter, rank, feedback, recorded_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          ON CONFLICT (student_id, class_id, month) DO UPDATE SET
            branch_id = EXCLUDED.branch_id,
            scores = EXCLUDED.scores,
            total_raw_score = EXCLUDED.total_raw_score,
            total_weighted_score = EXCLUDED.total_weighted_score,
            percentage = EXCLUDED.percentage,
            grade_letter = EXCLUDED.grade_letter,
            rank = EXCLUDED.rank,
            feedback = EXCLUDED.feedback,
            recorded_by = EXCLUDED.recorded_by,
            updated_at = NOW();
        `,
          [
            randomUUID(),
            classEntity.branchId ?? null,
            item.studentId,
            dto.classId,
            dto.month,
            academicYear,
            semester,
            JSON.stringify(item.scores),
            item.totalRawScore,
            item.totalWeightedScore,
            item.percentage,
            item.gradeLetter,
            item.rank,
            item.feedback,
            userId ?? null,
          ],
        );
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return this.getGradebookMatrix(dto.classId, dto.month);
  }

  async getStudentReportCard(
    studentId: number,
    month: string,
    classIdQuery?: number,
  ): Promise<StudentReportCardDto> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, deletedAt: IsNull() },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    let classId = classIdQuery;
    if (!classId) {
      const enrollment = await this.studentClassRepo.findOne({
        where: {
          studentId,
          status: ClassEnrollmentStatusEnum.ENROLLED,
        },
        order: { isPrimary: 'DESC', id: 'ASC' },
      });
      if (!enrollment) {
        throw new NotFoundException(
          `No active class enrollment found for student ID ${studentId}`,
        );
      }
      classId = enrollment.classId;
    }

    const matrix = await this.getGradebookMatrix(classId, month);
    const studentRow = matrix.rows.find((r) => r.studentId === studentId);

    if (!studentRow) {
      throw new NotFoundException(
        `Student ID ${studentId} is not enrolled in class ID ${classId}`,
      );
    }

    const components = matrix.gradingRule.components.map((comp) => {
      const raw = studentRow.scores[comp.id] ?? 0;
      const weighted = Number(((raw / comp.maxScore) * comp.weight).toFixed(2));
      return {
        id: comp.id,
        name: comp.name,
        maxScore: comp.maxScore,
        weight: comp.weight,
        rawScore: raw,
        weightedScore: weighted,
      };
    });

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      firstNameKm: student.firstNameKm,
      lastNameKm: student.lastNameKm,
      gender: student.gender,
      classId: matrix.classId,
      className: matrix.className,
      month,
      academicYear: matrix.academicYear,
      semester: matrix.semester,
      components,
      totalRawScore: studentRow.totalRawScore,
      totalWeightedScore: studentRow.totalWeightedScore,
      percentage: studentRow.percentage,
      gradeLetter: studentRow.gradeLetter,
      rank: studentRow.rank,
      totalStudents: matrix.classStats.totalStudents,
      feedback: studentRow.feedback,
    };
  }

  async exportCsv(classId: number, month: string): Promise<string> {
    const matrix = await this.getGradebookMatrix(classId, month);
    const components = matrix.gradingRule.components;

    const headers = [
      'No',
      'Student ID',
      'Khmer Name',
      'English Name',
      'Gender',
      ...components.map((c) => `${c.name} (Max ${c.maxScore}, ${c.weight}%)`),
      'Total Raw Score',
      'Total Weighted %',
      'Grade',
      'Rank',
      'Remarks',
    ];

    const csvLines: string[] = [headers.map((h) => `"${h}"`).join(',')];

    matrix.rows.forEach((row, index) => {
      const fullNameKm = [row.lastNameKm, row.firstNameKm].filter(Boolean).join(' ') || '-';
      const fullNameEn = `${row.lastName} ${row.firstName}`;

      const componentCells = components.map((c) => {
        const s = row.scores[c.id];
        return s !== undefined ? s : 0;
      });

      const line = [
        index + 1,
        row.studentCode || `STU-${row.studentId}`,
        fullNameKm,
        fullNameEn,
        row.gender,
        ...componentCells,
        row.totalRawScore,
        row.totalWeightedScore,
        row.gradeLetter,
        row.rank || '-',
        row.feedback || '',
      ];

      csvLines.push(line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    return csvLines.join('\n');
  }
}
