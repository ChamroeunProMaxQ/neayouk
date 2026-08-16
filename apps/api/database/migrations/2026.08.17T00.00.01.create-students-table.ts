import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      student_code VARCHAR(50) NULL UNIQUE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      first_name_km VARCHAR(255) NULL,
      last_name_km VARCHAR(255) NULL,
      gender VARCHAR(16) NOT NULL DEFAULT 'MALE',
      date_of_birth VARCHAR(255) NULL,
      contact VARCHAR(255) NULL,
      guardian_name VARCHAR(255) NULL,
      guardian_phone VARCHAR(50) NULL,
      payable_date INT NULL DEFAULT 1,
      registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_students_status (status),
      INDEX idx_students_student_code (student_code)
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS students;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
