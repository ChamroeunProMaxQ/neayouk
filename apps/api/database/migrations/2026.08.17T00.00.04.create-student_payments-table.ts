import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS student_payments (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      payment_number VARCHAR(100) NULL,
      student_id INT NOT NULL,
      class_id INT NULL,
      billing_year INT NOT NULL,
      billing_month INT NOT NULL,
      issue_date DATE NULL DEFAULT CURRENT_DATE,
      due_date DATE NULL,
      subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount_applied DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(26) NOT NULL DEFAULT 'UNPAID',
      payment_method VARCHAR(50) NULL DEFAULT 'CASH',
      receipt_number VARCHAR(100) NULL,
      paid_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT NULL,
      recorded_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_student_payments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_student_payments_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_student_payments_student ON student_payments (student_id);
    CREATE INDEX IF NOT EXISTS idx_student_payments_billing ON student_payments (billing_year, billing_month);
    CREATE INDEX IF NOT EXISTS idx_student_payments_status ON student_payments (status);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS student_payments CASCADE;`);
};
