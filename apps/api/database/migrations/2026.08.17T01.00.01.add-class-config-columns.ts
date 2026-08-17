import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  
  // Check if columns exist before adding to ensure idempotency
  const columns: { COLUMN_NAME: string }[] = await dataSource.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes'
  `);
  const columnNames = new Set(columns.map((c) => c.COLUMN_NAME.toLowerCase()));

  if (!columnNames.has('room')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN room VARCHAR(100) NULL AFTER section;`);
  }
  if (!columnNames.has('shift')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN shift VARCHAR(50) NOT NULL DEFAULT 'MORNING' AFTER room;`);
  }
  if (!columnNames.has('start_time')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN start_time VARCHAR(10) NULL DEFAULT '07:30' AFTER shift;`);
  }
  if (!columnNames.has('end_time')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN end_time VARCHAR(10) NULL DEFAULT '11:30' AFTER start_time;`);
  }
  if (!columnNames.has('start_date')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN start_date DATE NULL AFTER end_time;`);
  }
  if (!columnNames.has('end_date')) {
    await dataSource.query(`ALTER TABLE classes ADD COLUMN end_date DATE NULL AFTER start_date;`);
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  const columns: { COLUMN_NAME: string }[] = await dataSource.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes'
  `);
  const columnNames = new Set(columns.map((c) => c.COLUMN_NAME.toLowerCase()));

  if (columnNames.has('room')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN room;`);
  }
  if (columnNames.has('shift')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN shift;`);
  }
  if (columnNames.has('start_time')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN start_time;`);
  }
  if (columnNames.has('end_time')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN end_time;`);
  }
  if (columnNames.has('start_date')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN start_date;`);
  }
  if (columnNames.has('end_date')) {
    await dataSource.query(`ALTER TABLE classes DROP COLUMN end_date;`);
  }
};
