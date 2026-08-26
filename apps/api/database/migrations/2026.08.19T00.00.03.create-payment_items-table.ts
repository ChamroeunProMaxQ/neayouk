import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS payment_items (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      payment_id INT NOT NULL,
      fee_structure_id INT NULL,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_items_payment FOREIGN KEY (payment_id) REFERENCES student_payments (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_payment_items_fee_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payment_items_payment ON payment_items (payment_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS payment_items CASCADE;`);
};
