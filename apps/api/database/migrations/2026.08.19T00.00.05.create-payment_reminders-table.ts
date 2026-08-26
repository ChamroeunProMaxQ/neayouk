import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS payment_reminders (
      id SERIAL PRIMARY KEY,
      invoice_id INT NOT NULL,
      student_id INT NOT NULL,
      reminder_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
      notes TEXT NULL,
      sent_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_reminders_invoice FOREIGN KEY (invoice_id) REFERENCES student_payments (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_payment_reminders_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_payment_reminders_sent_by FOREIGN KEY (sent_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders (invoice_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS payment_reminders CASCADE;`);
};
