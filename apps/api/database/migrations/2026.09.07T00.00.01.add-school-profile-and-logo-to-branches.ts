import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_khmer VARCHAR(255) NULL;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS motto VARCHAR(255) NULL;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS receipt_footer_terms TEXT NULL;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS receipt_signature_title VARCHAR(100) NULL DEFAULT 'Authorized Signature / Cashier';
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    ALTER TABLE branches DROP COLUMN IF EXISTS name_khmer;
    ALTER TABLE branches DROP COLUMN IF EXISTS website;
    ALTER TABLE branches DROP COLUMN IF EXISTS motto;
    ALTER TABLE branches DROP COLUMN IF EXISTS logo_url;
    ALTER TABLE branches DROP COLUMN IF EXISTS receipt_footer_terms;
    ALTER TABLE branches DROP COLUMN IF EXISTS receipt_signature_title;
  `);
};
