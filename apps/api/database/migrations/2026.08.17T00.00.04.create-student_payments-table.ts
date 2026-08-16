import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS student_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      student_id INT NOT NULL,
      class_id INT NULL,
      billing_year INT NOT NULL,
      billing_month INT NOT NULL,
      amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount_applied DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(26) NOT NULL DEFAULT 'PAID',
      payment_method VARCHAR(50) NULL DEFAULT 'CASH',
      receipt_number VARCHAR(100) NULL,
      paid_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT NULL,
      recorded_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_student_billing (student_id, billing_year, billing_month),
      INDEX idx_student_payments_student (student_id),
      INDEX idx_student_payments_billing (billing_year, billing_month),
      INDEX idx_student_payments_status (status),
      CONSTRAINT fk_student_payments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_student_payments_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS student_payments;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
