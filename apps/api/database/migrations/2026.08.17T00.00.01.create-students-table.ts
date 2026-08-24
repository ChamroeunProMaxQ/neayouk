import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      student_code VARCHAR(50) NULL UNIQUE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      first_name_km VARCHAR(255) NULL,
      last_name_km VARCHAR(255) NULL,
      gender VARCHAR(16) NOT NULL DEFAULT 'MALE',
      date_of_birth VARCHAR(255) NULL,
      contact VARCHAR(255) NULL,
      guardian_name VARCHAR(255) NULL,
      guardian_phone VARCHAR(50) NULL,
      payable_date INT NULL DEFAULT 1,
      registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
    CREATE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS students CASCADE;`);
};
