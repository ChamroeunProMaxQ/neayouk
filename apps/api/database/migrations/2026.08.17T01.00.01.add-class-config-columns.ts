import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  
  await dataSource.query(`
    ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS room VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS shift VARCHAR(50) NOT NULL DEFAULT 'MORNING',
      ADD COLUMN IF NOT EXISTS start_time VARCHAR(10) NULL DEFAULT '07:30',
      ADD COLUMN IF NOT EXISTS end_time VARCHAR(10) NULL DEFAULT '11:30',
      ADD COLUMN IF NOT EXISTS start_date DATE NULL,
      ADD COLUMN IF NOT EXISTS end_date DATE NULL;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    ALTER TABLE classes 
      DROP COLUMN IF EXISTS room,
      DROP COLUMN IF EXISTS shift,
      DROP COLUMN IF EXISTS start_time,
      DROP COLUMN IF EXISTS end_time,
      DROP COLUMN IF EXISTS start_date,
      DROP COLUMN IF EXISTS end_date;
  `);
};
