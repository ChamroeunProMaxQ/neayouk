import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      address VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(100) NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      admin_user_id INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    );

    CREATE INDEX IF NOT EXISTS idx_branches_code ON branches (code);
    CREATE INDEX IF NOT EXISTS idx_branches_status ON branches (status);

    -- Add branch_id to domain tables
    ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users (branch_id);

    ALTER TABLE students ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students (branch_id);

    ALTER TABLE staff ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff (branch_id);

    ALTER TABLE classes ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_classes_branch_id ON classes (branch_id);

    ALTER TABLE programs ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_programs_branch_id ON programs (branch_id);

    ALTER TABLE class_timetables ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_class_timetables_branch_id ON class_timetables (branch_id);

    ALTER TABLE student_attendances ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_student_attendances_branch_id ON student_attendances (branch_id);

    ALTER TABLE teacher_attendances ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_teacher_attendances_branch_id ON teacher_attendances (branch_id);

    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_leave_requests_branch_id ON leave_requests (branch_id);

    ALTER TABLE student_scores ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_student_scores_branch_id ON student_scores (branch_id);

    ALTER TABLE student_payments ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_student_payments_branch_id ON student_payments (branch_id);

    ALTER TABLE grading_rules ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_grading_rules_branch_id ON grading_rules (branch_id);

    ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_fee_structures_branch_id ON fee_structures (branch_id);

    ALTER TABLE school_expenses ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_school_expenses_branch_id ON school_expenses (branch_id);

    ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_payrolls_branch_id ON payrolls (branch_id);

    ALTER TABLE roles ADD COLUMN IF NOT EXISTS branch_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_roles_branch_id ON roles (branch_id);

    -- Foreign key constraints
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_branch_id') THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_branch_id') THEN
        ALTER TABLE students ADD CONSTRAINT fk_students_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_staff_branch_id') THEN
        ALTER TABLE staff ADD CONSTRAINT fk_staff_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_classes_branch_id') THEN
        ALTER TABLE classes ADD CONSTRAINT fk_classes_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_programs_branch_id') THEN
        ALTER TABLE programs ADD CONSTRAINT fk_programs_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fee_structures_branch_id') THEN
        ALTER TABLE fee_structures ADD CONSTRAINT fk_fee_structures_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_school_expenses_branch_id') THEN
        ALTER TABLE school_expenses ADD CONSTRAINT fk_school_expenses_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payrolls_branch_id') THEN
        ALTER TABLE payrolls ADD CONSTRAINT fk_payrolls_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_branch_id;
    ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_branch_id;
    ALTER TABLE staff DROP CONSTRAINT IF EXISTS fk_staff_branch_id;
    ALTER TABLE classes DROP CONSTRAINT IF EXISTS fk_classes_branch_id;
    ALTER TABLE programs DROP CONSTRAINT IF EXISTS fk_programs_branch_id;
    ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fk_fee_structures_branch_id;
    ALTER TABLE school_expenses DROP CONSTRAINT IF EXISTS fk_school_expenses_branch_id;
    ALTER TABLE payrolls DROP CONSTRAINT IF EXISTS fk_payrolls_branch_id;

    ALTER TABLE users DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE students DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE staff DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE classes DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE programs DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE class_timetables DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE student_attendances DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE teacher_attendances DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE leave_requests DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE student_scores DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE grading_rules DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE fee_structures DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE school_expenses DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE payrolls DROP COLUMN IF EXISTS branch_id;
    ALTER TABLE roles DROP COLUMN IF EXISTS branch_id;

    DROP TABLE IF EXISTS branches CASCADE;
  `);
};
