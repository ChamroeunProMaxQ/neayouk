# Targeted Feature Testing Strategy

This rule enforces running unit and component tests specifically for affected feature modules during active frontend development, reserving full test suite execution only for shared package changes or pre-PR verification.

---

## Core Directives

1. **Target Affected Features**: Execute tests strictly for modified feature components or hooks during coding (`pnpm --filter web test src/features/<feature>/*`).
2. **Full Suite On Demand Only**: Run full project test sweeps (`pnpm --filter web test`) only when editing shared packages (`packages/contracts`) or before opening pull requests.
