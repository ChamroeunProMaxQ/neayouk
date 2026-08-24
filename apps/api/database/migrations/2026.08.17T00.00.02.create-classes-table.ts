import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NULL,
      grade_level VARCHAR(50) NULL,
      program VARCHAR(255) NULL,
      section VARCHAR(255) NULL,
      monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      teacher_id INT NULL,
      academic_year VARCHAR(20) NULL,
      semester VARCHAR(26) NOT NULL DEFAULT 'SEMESTER_1',
      capacity INT NOT NULL DEFAULT 30,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS idx_classes_status ON classes (status);
    CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes (academic_year);
    CREATE INDEX IF NOT EXISTS idx_classes_semester ON classes (semester);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS classes CASCADE;`);
};
