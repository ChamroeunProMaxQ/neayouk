import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS school_expenses (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      vendor VARCHAR(255) NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      receipt_ref VARCHAR(100) NULL,
      notes TEXT NULL,
      recorded_by INT NULL,
      approved_by INT NULL,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_school_expenses_recorded_by FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_school_expenses_approved_by FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_school_expenses_category ON school_expenses (category);
    CREATE INDEX IF NOT EXISTS idx_school_expenses_status ON school_expenses (status);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS school_expenses CASCADE;`);
};
