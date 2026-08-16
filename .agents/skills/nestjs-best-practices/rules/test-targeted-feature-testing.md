# Targeted Feature Testing Strategy Rule

This rule enforces running unit and integration tests specifically for affected feature modules during active backend development, reserving full test suite sweeps only for shared contract changes, global infrastructure edits, or pre-PR verification.

---

## Core Directives

1. **Targeted Execution**: Run tests specifically for modified NestJS services, controllers, or modules (`pnpm --filter api test apps/api/src/<feature>/*`).
2. **Full Suite On Demand**: Run full test suites (`pnpm --filter api test:unit`, `pnpm --filter api test:e2e`) only when editing `@repo/contracts`, global pipes/guards/filters, or before PR merging.
