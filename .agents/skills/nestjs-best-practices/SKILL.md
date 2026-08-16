---
name: nestjs-best-practices
description: NestJS best practices and architecture patterns for building production-ready applications. Includes monorepo @repo/contracts integration, modules, dependency injection, security, performance, database migrations, seed data, and targeted/all-condition testing strategies.
license: MIT
metadata:
  author: Kadajett
  version: "1.5.0"
---

# NestJS Best Practices

Comprehensive best practices guide for NestJS applications. Contains core architecture rules across 10 categories, including mandatory patterns for **Database Schema Migrations**, **Data Seeders**, **All-Condition Testing**, and **Targeted Feature Testing**.

---

## Related Skills & Sub-Modules

This master skill incorporates and mandates the following specialized backend sub-skills:

- [Feature Migration, Seed Data, and All-Condition Testing Skill](file:///e:/work/neayouk/.agents/skills/feature-migration-seed-test/SKILL.md) — Mandatory standard enforcing database schema migration scripts, realistic seed fixtures, and test suites covering all 6 condition categories (Happy Path, 400 Validation, 409 Conflict, 404/422 Not Found, 401/403 Auth, Edge/Boundary) for every new feature.
- [Targeted Feature Testing Strategy](file:///e:/work/neayouk/.agents/skills/targeted-feature-testing/SKILL.md) — Fast, focused testing workflow running affected feature tests during active iteration and running full test suites only when needed.

---

## When to Apply

Reference these guidelines when:

- Consuming shared `@repo/contracts` schemas (`packages/contracts/src/*.ts`), DTOs, and route path constants
- Creating or modifying features, entities, database tables, or API endpoints
- Writing database migrations and seeders (`apps/api/database/migrations` and `apps/api/database/seeds`)
- Executing unit and E2E integration tests (targeted during development, full suite pre-merge)
- Implementing authentication, authorization guards, and security filters
- Reviewing code for architecture, dependency injection, and performance issues

---

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Feature Migration, Seed & All-Condition Testing | CRITICAL | `feature-` |
| 2 | Targeted Feature Testing Strategy | HIGH | `test-` |
| 3 | Architecture | CRITICAL | `arch-` |
| 4 | Dependency Injection | CRITICAL | `di-` |
| 5 | Error Handling | HIGH | `error-` |
| 6 | Security | HIGH | `security-` |
| 7 | Performance | HIGH | `perf-` |
| 8 | Database & ORM | MEDIUM-HIGH | `db-` |
| 9 | API Design | MEDIUM | `api-` |
| 10 | DevOps & Microservices | LOW-MEDIUM | `devops-` |

---

## Quick Reference

### 1. Feature Migration, Seed & All-Condition Testing (CRITICAL)

- `feature-mandatory-migration` - Create timestamped Umzug migration with reversible `up` and `down` handlers for every schema addition or modification.
- `feature-mandatory-seeder` - Write Umzug seeder files inserting realistic, multi-state fixtures (`ACTIVE`, `DRAFT`, `ARCHIVED`, `NULL`/optional variations) with reversible `down` deletes.
- `feature-all-condition-testing` - Write Vitest unit & E2E tests covering **ALL 6 condition categories**:
  1. *Happy Path* (200/201 Success)
  2. *Validation Failures* (400 Bad Request)
  3. *Duplicate & Uniqueness Conflicts* (409 Conflict)
  4. *Resource Not Found & Invalid State* (404 / 422)
  5. *Authentication & Authorization Guards* (401 / 403)
  6. *Edge & Boundary Limits* (Min/Max values, null/optional fields, special characters)

### 2. Targeted Feature Testing Strategy (HIGH)

- `test-targeted-execution` - When developing or revising a feature, run tests ONLY for affected feature files (e.g., `pnpm --filter api test src/student/student.service.spec.ts` or `pnpm --filter api test:e2e test/student.e2e-spec.ts`).
- `test-full-suite-on-demand` - Run full test suites (`pnpm --filter api test:unit`, `pnpm --filter api test:e2e`) ONLY when updating shared `@repo/contracts`, global guards/filters/pipes, or performing pre-PR merge validation.

### 3. Architecture (CRITICAL)

- `arch-shared-contract-package` - Consume shared monorepo `@repo/contracts` for DTOs, Zod schemas, and route constants.
- `arch-avoid-circular-deps` - Avoid circular module dependencies.
- `arch-feature-modules` - Organize code by feature modules instead of technical layer buckets.
- `arch-module-sharing` - Proper module exports/imports; avoid duplicate provider declarations.
- `arch-single-responsibility` - Focused services over "god services".
- `arch-use-repository-pattern` - Abstract database access for clean testability.

### 4. Dependency Injection (CRITICAL)

- `di-avoid-service-locator` - Avoid service locator anti-pattern.
- `di-interface-segregation` - Interface Segregation Principle (ISP).
- `di-prefer-constructor-injection` - Constructor over property injection.
- `di-scope-awareness` - Understand singleton/request/transient scopes.
- `di-use-interfaces-tokens` - Use explicit injection tokens for interfaces.

### 5. Error Handling (HIGH)

- `error-use-exception-filters` - Centralized exception filters.
- `error-throw-http-exceptions` - Throw standard NestJS HTTP exceptions.
- `error-handle-async-errors` - Handle async promises properly.

### 6. Security (HIGH)

- `security-auth-jwt` - Secure JWT authentication strategies.
- `security-casl-rbac` - Declarative Role & Attribute Access Control (RBAC/ABAC) via CASL.
- `security-validate-all-input` - Validate all incoming payloads with Zod pipe and `@repo/contracts`.
- `security-use-guards` - Apply authentication and permission guards across controllers and endpoints.

### 7. Performance (HIGH)

- `perf-async-hooks` - Proper async lifecycle hooks.
- `perf-use-caching` - Implement caching strategies for heavy read endpoints.
- `perf-optimize-database` - Optimize database queries, indexes, and select fields.

### 8. Database & ORM (MEDIUM-HIGH)

- `db-use-transactions` - Transaction management for multi-entity operations.
- `db-avoid-n-plus-one` - Prevent N+1 database query issues via relations or query builder joins.
- `db-use-migrations` - Always use Umzug schema migrations for any database modification.

### 9. API Design (MEDIUM)

- `api-use-dto-serialization` - Response payload serialization using `@repo/contracts` schemas.
- `api-use-interceptors` - Handle cross-cutting concerns (logging, response envelopes).
- `api-versioning` - API URI versioning strategies (`/api/v1/...`).

### 10. DevOps & Microservices (LOW-MEDIUM)

- `devops-use-config-module` - Type-safe environment configuration with Zod.
- `devops-use-logging` - Structured logging using Nest-Winston and OpenTelemetry.

---

## Standard Feature Delivery Architecture

When implementing a new feature in `apps/api`:

```
apps/api/
├── database/
│   ├── migrations/
│   │   └── <timestamp>.create-<feature>-table.ts   # 1. Database Migration Script
│   └── seeds/
│       └── <timestamp>.<feature>-seeder.ts        # 2. Multi-State Fixture Seeder
├── src/
│   └── <feature>/
│       ├── <feature>.controller.ts                # Endpoint Handlers with Guards
│       ├── <feature>.service.ts                   # Business Logic & Repository Access
│       └── <feature>.module.ts                    # NestJS Module Definition
└── test/
    └── <feature>.e2e-spec.ts                      # 3. All 6 Condition Categories Test Suite
```

### Verification Pipeline

Before opening a PR or committing code:

```bash
# Targeted test during feature coding:
pnpm --filter api test src/<feature>/<feature>.service.spec.ts
pnpm --filter api test:e2e test/<feature>.e2e-spec.ts

# Full suite verification sweep (Pre-PR / Contract edits only):
pnpm --filter @repo/contracts build
pnpm --filter api migrate up
pnpm --filter api seed up
pnpm --filter api test:unit
pnpm --filter api test:e2e
```

For full details, see the dedicated standalone sub-skills:
- [`feature-migration-seed-test`](file:///e:/work/neayouk/.agents/skills/feature-migration-seed-test/SKILL.md)
- [`targeted-feature-testing`](file:///e:/work/neayouk/.agents/skills/targeted-feature-testing/SKILL.md)
