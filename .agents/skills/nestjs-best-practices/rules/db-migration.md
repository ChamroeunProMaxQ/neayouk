---
title: Umzug Database Migration & Seeding Flow
impact: HIGH
impactDescription: Ensures safe, atomic, version-controlled schema and seed changes using Umzug & TypeORM
tags: database, migrations, umzug, typeorm, mysql, schema
---

## Umzug Database Migration & Seeding Flow

**Impact: HIGH (Prevents database schema drift, corrupted states, and unsafe production deployments)**

All database schema modifications in this project must be managed via **Umzug** migrations wrapped around TypeORM MySQL DataSource. Never use `synchronize: true` in production or execute manual unversioned DDL statements.

**Incorrect (manual query without transaction or using synchronize):**

```typescript
// DANGEROUS: synchronize drops/alters columns unpredictably in production
TypeOrmModule.forRoot({
  type: 'mysql',
  synchronize: true,
});

// BAD: Executing DDL queries without transaction handling in migrations
export const up: Migration = async ({ context: dataSource }) => {
  await dataSource.query('ALTER TABLE `users` ADD `age` INT NOT NULL');
  // If this line fails, previous ALTER TABLE is stuck half-applied!
  await dataSource.query('CREATE INDEX `idx_user_age` ON `users`(`age`)');
};
```

**Correct (versioned Umzug migration with transactional rollback):**

```typescript
import type { Migration } from '../umzug.js';

export const up: Migration = async ({ context: dataSource }) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query('ALTER TABLE `users` ADD `age` INT DEFAULT 0');
    await queryRunner.query('CREATE INDEX `idx_users_age` ON `users`(`age`)');
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
};

export const down: Migration = async ({ context: dataSource }) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query('DROP INDEX `idx_users_age` ON `users`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `age`');
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
};
```

### CLI Entrypoints & Connection Teardown

CLI entrypoints (`database/migrator.ts` and `database/seeder.ts`) MUST wrap `runAsCLI()` in a `try...finally` block to call `dataSource.destroy()`. Failing to destroy the connection pool causes the CLI command process to hang indefinitely.

```typescript
import { migrator, dataSource } from './umzug.js';

try {
  await migrator.runAsCLI();
} finally {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
```

### CLI Command Flow

```bash
# 1. Create a new table migration template
pnpm --filter api migrate:create --name create-orders-table.ts

# 2. Add column migration template
pnpm --filter api migrate:create --name add-status-to-orders.ts

# 3. Apply pending migrations (SWC automatically builds database/ to dist-db/ via premigrate hook)
pnpm --filter api migrate up

# 4. Check pending or revert last migration
pnpm --filter api migrate pending
pnpm --filter api migrate down

# 5. Run seeders
pnpm --filter api seed up
```

Reference: [Umzug Documentation](https://github.com/sequelize/umzug)
