import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      user_id INT NULL,
      teacher_code VARCHAR(50) NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      name_km VARCHAR(255) NULL,
      gender VARCHAR(16) NOT NULL DEFAULT 'MALE',
      date_of_birth VARCHAR(255) NULL,
      phone VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      salary_in_hour DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
      specialization VARCHAR(255) NULL,
      bio TEXT NULL,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers (status);
    CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers (user_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS teachers CASCADE;`);
};
