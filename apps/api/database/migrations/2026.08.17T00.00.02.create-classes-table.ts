import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NULL,
      grade_level VARCHAR(50) NULL,
      program VARCHAR(255) NULL,
      section VARCHAR(255) NULL,
      monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      teacher_id BIGINT UNSIGNED NULL,
      academic_year VARCHAR(20) NULL,
      semester VARCHAR(26) NOT NULL DEFAULT 'SEMESTER_1',
      capacity INT NOT NULL DEFAULT 30,
      status VARCHAR(26) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_classes_status (status),
      INDEX idx_classes_academic_year (academic_year),
      INDEX idx_classes_semester (semester)
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS classes;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
