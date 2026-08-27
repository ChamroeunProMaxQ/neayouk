import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS payrolls (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      payroll_number VARCHAR(100) NOT NULL UNIQUE,
      staff_id INT NOT NULL,
      year INT NOT NULL,
      month INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      working_days INT NOT NULL DEFAULT 22,
      holiday_days INT NOT NULL DEFAULT 0,
      salary_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
      base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
      total_hours_worked DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
      calculated_base_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_deduction DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      gross_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      net_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
      payment_method VARCHAR(50) NULL DEFAULT 'BANK_TRANSFER',
      payment_date TIMESTAMP NULL,
      payment_reference VARCHAR(100) NULL,
      notes TEXT NULL,
      processed_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payrolls_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_payrolls_processed_by FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payrolls_staff_id ON payrolls (staff_id);
    CREATE INDEX IF NOT EXISTS idx_payrolls_year_month ON payrolls (year, month);
    CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls (status);

    CREATE TABLE IF NOT EXISTS payroll_items (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      payroll_id INT NOT NULL,
      item_type VARCHAR(30) NOT NULL DEFAULT 'BONUS',
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      description TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payroll_items_payroll FOREIGN KEY (payroll_id) REFERENCES payrolls (id) ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_id ON payroll_items (payroll_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_items_item_type ON payroll_items (item_type);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    DROP TABLE IF EXISTS payroll_items CASCADE;
    DROP TABLE IF EXISTS payrolls CASCADE;
  `);
};
