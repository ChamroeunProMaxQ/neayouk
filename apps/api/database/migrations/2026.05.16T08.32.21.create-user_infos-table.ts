import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS user_infos (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      image_url VARCHAR(255) NULL,
      thumbnail_url VARCHAR(255) NULL,
      phone VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      firstname VARCHAR(255) NULL,
      lastname VARCHAR(255) NULL,
      dob DATE NULL,
      gender VARCHAR(12) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_infos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS user_infos CASCADE;`);
};
