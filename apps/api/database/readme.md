# Database Migrations & Seeders

Database schema migrations and data seeders are managed using **Umzug** with TypeORM & MySQL, transpiled via **SWC**.

## Available Commands

Run these commands from the root directory or inside `apps/api`:

### Migrations

```bash
# Apply pending migrations
pnpm --filter api migrate up

# Revert last migration
pnpm --filter api migrate down

# Revert all migrations
pnpm --filter api migrate down --to 0

# Check pending migrations
pnpm --filter api migrate pending

# Check executed migrations
pnpm --filter api migrate executed

# Create a new migration file
pnpm --filter api migrate:create --name create-orders-table.ts
pnpm --filter api migrate:create --name add-status-to-orders.ts
```

### Seeders

```bash
# Execute seeders
pnpm --filter api seed up

# Rollback seeders
pnpm --filter api seed down

# Create a new seed file
pnpm --filter api seed:create --name user-seeder.ts
```

## Production Execution (Pure JS)

In production environments (e.g., Docker containers where devDependencies like TypeScript and SWC are omitted):

1. **Build Phase (CI/CD)**: `pnpm --filter api build` compiles `src/` -> `dist/` and `database/` -> `dist-db/`.
2. **Runtime Phase**: Run pure compiled JavaScript with standard Node.js:

```bash
# Run pending migrations in production
node dist-db/migrator.js up

# Run seeders in production
node dist-db/seeder.js up
# (or via package scripts: pnpm migrate:prod up / pnpm seed:prod up)
```

## How It Works

- `database/` sits at the same level as `src/` inside `apps/api/`.
- `pnpm migrate` and `pnpm seed` automatically compile `database/` into `dist-db/` via SWC before running.
- In production, `dist-db/umzug.js` detects `.js` extension at runtime and loads compiled `.js` migrations and seeders directly with zero build overhead.
- `umzug.ts` exports `migrator`, `seeder`, and `dataSource` for both CLI usage and global test lifecycle hooks (`vitest.global-setup.ts`).
