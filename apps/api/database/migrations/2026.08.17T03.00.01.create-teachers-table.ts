import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      user_id INT NULL,
      staff_code VARCHAR(50) NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      name_km VARCHAR(255) NULL,
      gender VARCHAR(16) NOT NULL DEFAULT 'MALE',
      date_of_birth VARCHAR(255) NULL,
      phone VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      department VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
      designation VARCHAR(100) NOT NULL DEFAULT 'Teacher',
      specialization VARCHAR(255) NULL,
      bio TEXT NULL,
      employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
      salary_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
      base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
      joining_date DATE NULL DEFAULT CURRENT_DATE,
      bank_name VARCHAR(100) NULL,
      bank_account_name VARCHAR(255) NULL,
      bank_account_number VARCHAR(100) NULL,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_staff_status ON staff (status);
    CREATE INDEX IF NOT EXISTS idx_staff_department ON staff (department);
    CREATE INDEX IF NOT EXISTS idx_staff_salary_type ON staff (salary_type);
    CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff (user_id);

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_classes_teacher' AND table_name = 'classes'
      ) THEN
        ALTER TABLE classes
        ADD CONSTRAINT fk_classes_teacher
        FOREIGN KEY (teacher_id) REFERENCES staff (id)
        ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    ALTER TABLE classes DROP CONSTRAINT IF EXISTS fk_classes_teacher;
    DROP TABLE IF EXISTS staff CASCADE;
  `);
};
