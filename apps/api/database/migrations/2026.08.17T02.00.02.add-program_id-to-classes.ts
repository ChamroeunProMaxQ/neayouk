import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    ALTER TABLE classes ADD COLUMN IF NOT EXISTS program_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes (program_id);
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_classes_program_id') THEN 
        ALTER TABLE classes ADD CONSTRAINT fk_classes_program_id FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL; 
      END IF; 
    END $$;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    ALTER TABLE classes DROP CONSTRAINT IF EXISTS fk_classes_program_id;
    DROP INDEX IF EXISTS idx_classes_program_id;
    ALTER TABLE classes DROP COLUMN IF EXISTS program_id;
  `);
};
