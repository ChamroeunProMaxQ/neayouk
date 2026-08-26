import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS payment_refunds (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      payment_id INT NULL,
      invoice_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      reason TEXT NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      refunded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_refunds_invoice FOREIGN KEY (invoice_id) REFERENCES student_payments (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_payment_refunds_processed_by FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payment_refunds_invoice ON payment_refunds (invoice_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS payment_refunds CASCADE;`);
};
