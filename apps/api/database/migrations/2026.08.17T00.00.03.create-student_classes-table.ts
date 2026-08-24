import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS student_classes (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL,
      class_id INT NOT NULL,
      academic_year VARCHAR(20) NOT NULL,
      semester VARCHAR(26) NOT NULL DEFAULT 'SEMESTER_1',
      is_primary BOOLEAN NOT NULL DEFAULT TRUE,
      status VARCHAR(26) NOT NULL DEFAULT 'ENROLLED',
      enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      remarks TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_student_classes_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_student_classes_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes (student_id);
    CREATE INDEX IF NOT EXISTS idx_student_classes_class ON student_classes (class_id);
    CREATE INDEX IF NOT EXISTS idx_student_classes_academic ON student_classes (academic_year, semester);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS student_classes CASCADE;`);
};
