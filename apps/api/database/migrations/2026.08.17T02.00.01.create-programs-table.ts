import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      books JSON NULL,
      grade_levels JSON NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      UNIQUE INDEX uq_programs_code (code),
      INDEX idx_programs_status (status)
    ) ENGINE=InnoDB;
  `);

  const cols: Array<{ COLUMN_NAME: string }> = await dataSource.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'programs'
      AND COLUMN_NAME = 'books';
  `);

  if (cols.length === 0) {
    await dataSource.query(`
      ALTER TABLE programs
      ADD COLUMN books JSON NULL AFTER code;
    `);
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS programs;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
