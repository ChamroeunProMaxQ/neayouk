import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';
import { DefaultGradingComponents, DefaultGradeScale } from '@repo/contracts';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // 1. Seed Master Grading Rule
  const ruleResult = await dataSource.query(`
    INSERT INTO grading_rules (uuid, name, code, academic_year, semester, components, grade_scale, is_default, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      components = EXCLUDED.components,
      grade_scale = EXCLUDED.grade_scale,
      is_default = EXCLUDED.is_default,
      updated_at = NOW()
    RETURNING id;
  `, [
    randomUUID(),
    'Standard School Evaluation Scheme',
    'RULE-DEFAULT',
    '2025-2026',
    'SEMESTER_1',
    JSON.stringify(DefaultGradingComponents),
    JSON.stringify(DefaultGradeScale),
    true,
    'ACTIVE',
  ]);

  // 2. Fetch sample students and classes
  const students = await dataSource.query(`SELECT id FROM students WHERE deleted_at IS NULL LIMIT 10`);
  const classes = await dataSource.query(`SELECT id, academic_year, semester FROM classes WHERE deleted_at IS NULL LIMIT 2`);
  const adminUser = await dataSource.query(`SELECT id FROM users WHERE user_type = 'ADMIN' LIMIT 1`);
  const adminUserId = adminUser && adminUser.length > 0 ? adminUser[0].id : null;

  if (students && students.length > 0 && classes && classes.length > 0) {
    const classItem = classes[0];
    const classId = classItem.id;
    const academicYear = classItem.academic_year || '2025-2026';
    const semester = classItem.semester || 'SEMESTER_1';
    const months = ['2026-07', '2026-08'];

    // Seed mock scores with varying performances
    const scorePresets = [
      { reading: 9.5, vocab: 29.0, grammar: 19.0, listening: 19.5, speaking: 9.5, homework: 10.0, feedback: 'Outstanding performance across all skills.' },
      { reading: 8.5, vocab: 27.0, grammar: 17.5, listening: 18.0, speaking: 8.5, homework: 9.5, feedback: 'Strong grasp of vocabulary and listening.' },
      { reading: 7.0, vocab: 24.0, grammar: 15.0, listening: 16.0, speaking: 8.0, homework: 9.0, feedback: 'Good progress. Needs slightly more practice in grammar.' },
      { reading: 6.5, vocab: 20.0, grammar: 13.0, listening: 14.5, speaking: 7.0, homework: 8.0, feedback: 'Fair work. Encourage reading more English storybooks.' },
      { reading: 5.0, vocab: 16.0, grammar: 10.0, listening: 11.0, speaking: 6.0, homework: 7.0, feedback: 'Passing. Recommended extra grammar sessions.' },
      { reading: 4.0, vocab: 12.0, grammar: 8.0, listening: 9.0, speaking: 5.0, homework: 6.0, feedback: 'Needs improvement in vocabulary retention.' },
    ];

    for (const month of months) {
      const studentScoreData: {
        studentId: number;
        scores: Record<string, number>;
        totalRaw: number;
        totalWeighted: number;
        percentage: number;
        gradeLetter: string;
        feedback: string;
      }[] = [];

      for (let i = 0; i < students.length; i++) {
        const studentId = students[i].id;
        const preset = scorePresets[i % scorePresets.length];
        const scores = {
          reading: preset.reading,
          vocab: preset.vocab,
          grammar: preset.grammar,
          listening: preset.listening,
          speaking: preset.speaking,
          homework: preset.homework,
        };

        const totalRaw = Object.values(scores).reduce((a, b) => a + b, 0);

        // Calculate weighted score: sum of (raw / maxScore) * weight
        let totalWeighted = 0;
        for (const comp of DefaultGradingComponents) {
          const raw = scores[comp.id] ?? 0;
          totalWeighted += (raw / comp.maxScore) * comp.weight;
        }

        const percentage = Number(totalWeighted.toFixed(2));
        let gradeLetter = 'F';
        for (const scale of DefaultGradeScale) {
          if (percentage >= scale.minScore && percentage <= scale.maxScore) {
            gradeLetter = scale.letter;
            break;
          }
        }

        studentScoreData.push({
          studentId,
          scores,
          totalRaw: Number(totalRaw.toFixed(2)),
          totalWeighted: percentage,
          percentage,
          gradeLetter,
          feedback: preset.feedback,
        });
      }

      // Sort by total weighted score descending to compute rank
      studentScoreData.sort((a, b) => b.totalWeighted - a.totalWeighted);

      for (let rankIdx = 0; rankIdx < studentScoreData.length; rankIdx++) {
        const item = studentScoreData[rankIdx];
        const rank = rankIdx + 1;

        await dataSource.query(`
          INSERT INTO student_scores (
            uuid, student_id, class_id, month, academic_year, semester,
            scores, total_raw_score, total_weighted_score, percentage,
            grade_letter, rank, feedback, recorded_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT (student_id, class_id, month) DO UPDATE SET
            scores = EXCLUDED.scores,
            total_raw_score = EXCLUDED.total_raw_score,
            total_weighted_score = EXCLUDED.total_weighted_score,
            percentage = EXCLUDED.percentage,
            grade_letter = EXCLUDED.grade_letter,
            rank = EXCLUDED.rank,
            feedback = EXCLUDED.feedback,
            updated_at = NOW();
        `, [
          randomUUID(),
          item.studentId,
          classId,
          month,
          academicYear,
          semester,
          JSON.stringify(item.scores),
          item.totalRaw,
          item.totalWeighted,
          item.percentage,
          item.gradeLetter,
          rank,
          item.feedback,
          adminUserId,
        ]);
      }
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DELETE FROM student_scores;`);
  await dataSource.query(`DELETE FROM grading_rules WHERE code = 'RULE-DEFAULT';`);
};
