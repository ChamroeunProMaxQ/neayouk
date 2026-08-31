import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    ALTER TABLE student_payments ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_student_payments_branch_id ON student_payments (branch_id);

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_payments_branch_id') THEN
        ALTER TABLE student_payments ADD CONSTRAINT fk_student_payments_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
    END $$;

    -- Backfill existing payments with student's branch_id if NULL
    UPDATE student_payments sp
    SET branch_id = s.branch_id
    FROM students s
    WHERE sp.student_id = s.id AND sp.branch_id IS NULL AND s.branch_id IS NOT NULL;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    ALTER TABLE student_payments DROP CONSTRAINT IF EXISTS fk_student_payments_branch_id;
    DROP INDEX IF EXISTS idx_student_payments_branch_id;
    ALTER TABLE student_payments DROP COLUMN IF EXISTS branch_id;
  `);
};
