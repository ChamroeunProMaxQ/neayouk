import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS student_scores (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      student_id INT NOT NULL,
      class_id INT NOT NULL,
      month VARCHAR(7) NOT NULL,
      academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
      semester VARCHAR(26) NOT NULL DEFAULT 'SEMESTER_1',
      scores JSON NOT NULL DEFAULT '{}',
      total_raw_score NUMERIC(6,2) NOT NULL DEFAULT 0.00,
      total_weighted_score NUMERIC(6,2) NOT NULL DEFAULT 0.00,
      percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
      grade_letter VARCHAR(5) NOT NULL DEFAULT 'F',
      rank INT NULL,
      feedback TEXT NULL,
      recorded_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_student_scores_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      CONSTRAINT fk_student_scores_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
      CONSTRAINT fk_student_scores_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL,
      CONSTRAINT uq_student_scores_student_class_month UNIQUE (student_id, class_id, month)
    );
    CREATE INDEX IF NOT EXISTS idx_student_scores_class_month ON student_scores (class_id, month);
    CREATE INDEX IF NOT EXISTS idx_student_scores_student ON student_scores (student_id);
    CREATE INDEX IF NOT EXISTS idx_student_scores_month ON student_scores (month);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS student_scores CASCADE;`);
};
