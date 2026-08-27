import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    -- Explicitly drop legacy teachers table if it exists
    DROP TABLE IF EXISTS teachers CASCADE;
  `);
};

export const down: MigrationFn<DataSource> = async () => {
  // No-op rollback
};
