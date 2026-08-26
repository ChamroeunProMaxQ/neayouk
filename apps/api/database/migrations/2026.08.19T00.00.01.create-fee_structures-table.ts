import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS fee_structures (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'TUITION',
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
      is_optional BOOLEAN NOT NULL DEFAULT FALSE,
      program_id INT NULL,
      academic_year VARCHAR(20) NULL,
      description TEXT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_fee_structures_program FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fee_structures_category ON fee_structures (category);
    CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON fee_structures (is_active);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS fee_structures CASCADE;`);
};
