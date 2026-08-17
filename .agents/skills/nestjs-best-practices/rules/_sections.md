# Sections

This file defines all sections, their ordering, impact levels, and descriptions for NestJS Best Practices.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Feature Migration, Seed & All-Condition Testing (db / feature)

**Impact:** CRITICAL
**Description:** Mandatory workflow (`db-feature-migration-seed-test.md`) requiring timestamped Umzug database migrations (`up`/`down`), multi-state data seeders, and Vitest test suites covering all 6 condition categories (Happy Path, 400 Bad Request, 409 Conflict, 404/422 Not Found, 401/403 Auth, Edge & Boundary limits) for every new feature.

## 2. Architecture & Code Style (arch / code)

**Impact:** CRITICAL
**Description:** Proper module organization, consuming shared monorepo `@repo/contracts` DTOs/schemas, and early returns / guard clauses (`code-prefer-early-return.md`) form the foundation of maintainable NestJS applications.

## 3. Dependency Injection (di)

**Impact:** CRITICAL
**Description:** NestJS's IoC container is powerful but can be misused. Understanding scopes, injection tokens, and proper patterns is essential for testable code.

## 4. Error Handling (error)

**Impact:** HIGH
**Description:** Consistent error handling improves debugging, user experience, and API reliability. Centralized exception filters ensure uniform error responses conforming to `ResponseDto`.

## 5. Security (security)

**Impact:** HIGH
**Description:** Input validation with `@repo/contracts` Zod schemas, JWT authentication, CASL RBAC/ABAC authorization guards (`security-casl-rbac.md`), and rate limiting are non-negotiable.

## 6. Performance (perf)

**Impact:** HIGH
**Description:** Optimizing request handling, async hooks, caching strategies, and database query builder joins directly impacts application responsiveness and scalability.

## 7. Testing & Execution Strategy (test)

**Impact:** MEDIUM-HIGH
**Description:** Well-tested applications are reliable. Combines targeted feature testing during development (`test-targeted-feature-testing.md`) with NestJS testing utilities (`@nestjs/testing`) and Supertest E2E automation.

## 8. Database & ORM (db)

**Impact:** MEDIUM-HIGH
**Description:** Proper database access patterns, entity updates via repository merge (`db-prefer-repository-merge.md`), TypeORM transactions (`db-use-transactions.md`), avoiding N+1 queries (`db-avoid-n-plus-one.md`), and Umzug migrations (`db-use-migrations.md`).

## 9. API Design (api)

**Impact:** MEDIUM
**Description:** RESTful conventions, versioning, DTO serialization using `nestjs-zod` and `@repo/contracts`, and uniform response envelopes.

## 10. DevOps & Microservices (devops / micro)

**Impact:** LOW-MEDIUM
**Description:** Type-safe configuration management, structured logging (Winston + Loki), OpenTelemetry instrumentation, and graceful shutdown.
