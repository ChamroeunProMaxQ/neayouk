import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token TEXT NOT NULL,
      token_type VARCHAR(26) NOT NULL,
      exp_date DATETIME NOT NULL,
      status VARCHAR(26) NOT NULL,
      user_id INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS user_tokens;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
