import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    -- 1. Remove orphan records that don't match staff ids
    DELETE FROM teacher_attendances WHERE teacher_id NOT IN (SELECT id FROM staff);
    DELETE FROM leave_requests WHERE teacher_id NOT IN (SELECT id FROM staff);

    -- 2. Drop and re-add foreign key on teacher_attendances to staff (id)
    ALTER TABLE teacher_attendances DROP CONSTRAINT IF EXISTS fk_teacher_attendances_teacher;
    ALTER TABLE teacher_attendances ADD CONSTRAINT fk_teacher_attendances_teacher 
      FOREIGN KEY (teacher_id) REFERENCES staff (id) ON DELETE CASCADE;

    -- 3. Drop and re-add foreign key on leave_requests to staff (id)
    ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS fk_leave_requests_teacher;
    ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_teacher 
      FOREIGN KEY (teacher_id) REFERENCES staff (id) ON DELETE CASCADE;

    -- 4. Drop legacy teachers table if it exists
    DROP TABLE IF EXISTS teachers CASCADE;
  `);
};

export const down: MigrationFn<DataSource> = async () => {
  // No-op rollback
};
