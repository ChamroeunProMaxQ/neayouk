---
title: Co-locate Related Tests, Subcomponents, Types, and Utilities
impact: HIGH
impactDescription: Eliminates folder duplication and ensures features are easily refactored or removed cleanly.
tags: architecture, colocation, maintenance
---

## Co-locate Related Tests, Subcomponents, Types, and Utilities

**Impact: HIGH (Keeps feature context unified and simplifies safe code deletion)**

Avoid spreading unit test files, sub-components, helper utilities, and TypeScript types into distant top-level mirror trees (`tests/unit/components/`, `types/interfaces/`). Co-locate assets directly adjacent to the component or feature module they support.

When a feature is deprecated or deleted, co-location ensures that deleting the feature folder removes 100% of associated tests, sub-components, types, and styles without leaving orphaned files scattered across the repository.

**Incorrect (Orphaned distant test and type hierarchies):**

```
root/
├── src/
│   └── components/
│       └── OrderTable.tsx
├── tests/
│   └── components/
│       └── OrderTable.test.tsx    # Mirroring root tree manually
└── types/
    └── components/
        └── OrderTable.d.ts        # Out-of-sync type definitions
```

**Correct (Co-located feature component directory):**

```
src/features/orders/components/order-table/
├── order-table.tsx                # Main exportable component
├── order-table.test.tsx           # Co-located Vitest + RTL test
├── order-table-row.tsx            # Internal sub-component (not exported outside order-table)
├── order-table-types.ts           # Types specific to order table view
└── order-table-utils.ts           # Helper functions specific to table sorting/formatting
```

**Guidelines for Co-location:**
1. **Scope visibility**: Internal sub-components (like `order-table-row.tsx`) should only be imported within `order-table/`. Do not export internal sub-components from feature barrels unless requested.
2. **Co-located tests**: Name unit test files `<component-name>.test.tsx` or `<hook-name>.test.ts` right next to the target implementation file.
3. **Delete safety**: Removing `src/features/orders/components/order-table/` automatically deletes all its tests, types, and helpers without breaking independent modules.

Reference: [Kent C. Dodds - Colocation](https://kentcdodds.com/blog/colocation)
