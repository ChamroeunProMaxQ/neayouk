# Mandatory Feature Migration, Seed Data, and All-Condition Testing Rule

This rule enforces that **no new feature, domain entity, or API endpoint is considered complete until it includes all three required artifacts:**

1. **Database Schema Migration** (Umzug timestamped migration script with reversible `up` and `down` handlers).
2. **Database Seed Data** (Umzug seeder script populating realistic multi-state domain fixtures).
3. **Comprehensive All-Condition Testing Suite** (Vitest unit & E2E tests covering Happy Path, 400 Bad Request, 409 Conflict, 404/422 Not Found, 401/403 Auth, Edge & Boundary limits).

---

## Core Directives

- **Schema Migrations**: Always use `pnpm --filter api migrate:create --name <descriptive-name>.ts` to generate reversible schema migrations.
- **Seeders**: Always use `pnpm --filter api seed:create --name <descriptive-name>.ts` to seed multi-state test data (`ACTIVE`, `DRAFT`, `ARCHIVED`, `NULL`/optional variations).
- **All-Condition Test Matrix**: Every feature MUST include tests covering all 6 condition categories before PR merge.
