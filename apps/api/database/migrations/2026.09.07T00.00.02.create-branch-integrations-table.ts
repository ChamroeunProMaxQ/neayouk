import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS branch_integrations (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL DEFAULT 'TELEGRAM',
      is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      bot_token_encrypted TEXT NULL,
      bot_username VARCHAR(100) NULL,
      default_chat_id VARCHAR(100) NULL,
      attendance_chat_id VARCHAR(100) NULL,
      payment_chat_id VARCHAR(100) NULL,
      leave_chat_id VARCHAR(100) NULL,
      announcement_chat_id VARCHAR(100) NULL,
      notification_events JSONB NOT NULL DEFAULT '{"attendance": true, "payment": true, "leave": true, "announcement": false}'::jsonb,
      last_tested_at TIMESTAMP NULL,
      last_test_status VARCHAR(50) NOT NULL DEFAULT 'NOT_TESTED',
      last_error_message TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_branch_integrations_branch_provider ON branch_integrations (branch_id, provider);
    CREATE INDEX IF NOT EXISTS idx_branch_integrations_branch_id ON branch_integrations (branch_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    DROP TABLE IF EXISTS branch_integrations;
  `);
};
