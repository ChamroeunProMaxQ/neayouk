import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS grading_rules (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      academic_year VARCHAR(20) NULL,
      semester VARCHAR(26) NULL,
      components JSON NOT NULL,
      grade_scale JSON NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT TRUE,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS idx_grading_rules_status ON grading_rules (status);
    CREATE INDEX IF NOT EXISTS idx_grading_rules_default ON grading_rules (is_default);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS grading_rules CASCADE;`);
};
