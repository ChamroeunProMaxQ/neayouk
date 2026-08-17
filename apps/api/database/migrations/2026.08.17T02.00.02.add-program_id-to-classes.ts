import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // Check if column already exists
  const columns: Array<{ COLUMN_NAME: string }> = await dataSource.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'classes'
      AND COLUMN_NAME = 'program_id';
  `);

  if (columns.length === 0) {
    await dataSource.query(`
      ALTER TABLE classes
      ADD COLUMN program_id INT NULL AFTER grade_level,
      ADD INDEX idx_classes_program_id (program_id),
      ADD CONSTRAINT fk_classes_program_id FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
    `);
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  try {
    await dataSource.query(`
      ALTER TABLE classes
      DROP FOREIGN KEY fk_classes_program_id,
      DROP INDEX idx_classes_program_id,
      DROP COLUMN program_id;
    `);
  } catch {
    // Graceful fallback if FK/column does not exist
  }
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
