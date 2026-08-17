---
name: react-frontend-best-practices
description: Production-grade React frontend best practices and architecture patterns for experienced developers. Covers Layer-based architecture, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, React Router, Vitest, Testing Library, Playwright, oxlint, oxfmt, monorepo @repo/contracts integration, Feature List Tables, Infinite Scroll Data Tables, and Targeted Feature Testing.
license: MIT
metadata:
  author: Kadajett
  version: "1.3.0"
---

# React Frontend Best Practices

Comprehensive best practices guide for building scalable, production-ready React web applications. Contains core architecture rules across 10 categories, including mandatory patterns for **Feature List Tables**, **Infinite Scroll Data Tables**, and **Targeted Feature Testing**.

---

## Selected Stack Architecture

- **Framework**: React 18/19
- **Language**: TypeScript (Strict Mode)
- **Shared Monorepo Package**: `@repo/contracts` (Single source of truth for Zod schemas, DTO types, and `API_ROUTE` constants)
- **UI**: Tailwind CSS + shadcn/ui (Radix UI, `cva`, `cn`)
- **Client State**: Zustand
- **Server State & API**: TanStack Query (React Query)
- **Data Tables**: TanStack Table v8 + `useInfiniteQuery` + `useUrlFilters`
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Routing**: React Router
- **Unit & Component Testing**: Vitest + React Testing Library + MSW
- **E2E Testing**: Playwright
- **Linter & Formatter**: oxlint + oxfmt
- **Architecture Pattern**: Layer-based & Modular Feature-based (`apps/web/src/features/*`)

---

## Related Skills & Sub-Modules

This master skill incorporates and mandates the following specialized frontend sub-skills:

- [Feature List Table Architecture](file:///e:/work/neayouk/.agents/skills/feature-list-table/SKILL.md) — Mandatory standards for feature list components, URL sync (`useUrlFilters`), debounced search, modal dialogs, and CRUD mutations.
- [Infinite Scroll Data Table Skill](file:///e:/work/neayouk/.agents/skills/infinite-scroll-table/SKILL.md) — Mandatory rules for TanStack Query `useInfiniteQuery` integration with TanStack Table v8, page flattening, and intersection observer sentinels.
- [Targeted Feature Testing Strategy](file:///e:/work/neayouk/.agents/skills/targeted-feature-testing/SKILL.md) — Fast, focused testing workflow running affected feature tests during active development and running full test suites only when needed.

---

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture & Layering | CRITICAL | `arch-` |
| 2 | TypeScript & Type Safety | CRITICAL | `ts-` |
| 3 | Client State (Zustand) | HIGH | `state-` |
| 4 | Server State & API (TanStack Query) | HIGH | `query-` |
| 5 | Feature List Tables & Infinite Scroll | HIGH | `table-` |
| 6 | Forms & Validation (RHF + Zod) | HIGH | `form-` |
| 7 | UI & Styling (Tailwind + shadcn/ui) | HIGH | `ui-` |
| 8 | Routing & Data (React Router) | MEDIUM-HIGH | `route-` |
| 9 | Performance Optimization | MEDIUM-HIGH | `perf-` |
| 10 | Testing & Quality (Vitest, RTL, Playwright) | MEDIUM-HIGH | `test-` |

---

## Quick Reference

### 1. Architecture & Layering (CRITICAL)

- `arch-shared-contract-package` - Consume shared monorepo `@repo/contracts` for schemas, DTOs, and route paths.
- `arch-layer-separation` - Enforce strict presentation, application, domain, and data layer separation.
- `arch-feature-folder-structure` - Organize code by modular features (`apps/web/src/features/<feature-name>/`).
- `arch-decouple-ui-from-state` - Keep presentation components pure and delegate business logic to custom hooks.
- `arch-component-colocation` - Co-locate tests, styles, subcomponents, and types with their feature.

### 2. TypeScript & Type Safety (CRITICAL)

- `ts-strict-types-no-any` - Enforce strict mode and prohibit explicit or implicit `any`.
- `ts-discriminated-unions` - Model complex UI variants and async state with discriminated unions.
- `ts-type-safe-props-generics` - Define explicit component prop contracts and generic components.
- `ts-utility-types-inference` - Infer types directly from Zod schemas and `@repo/contracts` to eliminate duplication.

### 3. Client State (Zustand) (HIGH)

- `state-atomic-selectors` - Use fine-grained atomic selectors to prevent unnecessary component re-renders.
- `state-slice-pattern` - Split large global stores into modular, domain-focused slices.
- `state-transient-vs-persistent` - Isolate transient UI state from persistent global application state.
- `state-middleware-persistance` - Configure typed store persistence with safe hydration strategies.

### 4. Server State & API (TanStack Query) (HIGH)

- `query-key-factories` - Use centralized query key factories for structured cache invalidation.
- `query-custom-hooks` - Encapsulate all queries and mutations inside typed custom hooks using `@repo/contracts`.
- `query-optimistic-updates` - Implement optimistic updates with context rollback on failure.
- `query-stale-cache-management` - Define explicit `staleTime` and `gcTime` strategies per query type.

### 5. Feature List Tables & Infinite Scroll (HIGH)

- `table-url-state-sync` - Synchronize all table filters, search keywords, and sort fields with URL query params using `useUrlFilters(ZodSchema)`.
- `table-debounced-search` - Debounce search input values (e.g. `useDebounce(search, 800)`) before updating query params to prevent API spam.
- `table-infinite-scroll-query` - Use TanStack Query `useInfiniteQuery` (NEVER standard `useQuery` with manual array appending) for infinite scrolling.
- `table-page-flattening` - Flatten `data.pages` into a memoized array (`data?.pages.flatMap(p => p.data)`) for table rendering.
- `table-tanstack-v8-shadcn` - Combine TanStack Table v8 head/row models with shadcn UI primitive table elements.
- `table-sentinel-intersection` - Attach `sentinelRef` from `useInfiniteScroll` to a bottom element for smooth automatic page fetching.
- `table-server-sorting` - Pass `manualSorting: true` to TanStack Table and handle header clicks via URL query parameters.
- `ui-action-rbac-enforcement` - Enforce Role-Based Access Control (RBAC) on all Create, Edit, Delete, and action trigger buttons using `usePermission()`.

### 6. Forms & Validation (React Hook Form + Zod) (HIGH)

- `form-zod-schema-validation` - Enforce contract-based Zod schema and DTO sharing from `@repo/contracts` with Zod resolver compatibility across frontend forms and backend endpoints.
- `form-rhf-controller-integration` - Integrate custom shadcn/ui components using RHF `Controller`.
- `form-performance-uncontrolled` - Utilize uncontrolled inputs to avoid re-renders on keystrokes.
- `form-field-arrays-dynamic` - Manage dynamic field lists efficiently using `useFieldArray`.

### 7. UI & Styling (Tailwind + shadcn/ui) (HIGH)

- `ui-shadcn-primitives` - Extend shadcn/ui components without breaking accessible Radix primitives.
- `ui-cn-cva-variants` - Create type-safe component variants using `cva` and `cn` utilities.
- `ui-responsive-fluid-layouts` - Build mobile-first responsive layouts with semantic Tailwind utilities.
- `ui-theme-tokens-design-system` - Manage dark mode and color palettes via design tokens.

### 8. Routing & Data (React Router) (MEDIUM-HIGH)

- `route-loaders-actions` - Fetch data and handle submissions in parallel using loaders and actions.
- `route-code-splitting-lazy` - Code-split route segments using `React.lazy` and Suspense.
- `route-search-params-state` - Sync filterable/searchable UI states with URL query params.
- `route-guards-layout-nesting` - Use layout routes for authentication guards and shared view shells.

### 9. Performance Optimization (MEDIUM-HIGH)

- `perf-memoization-boundaries` - Apply `useMemo`, `useCallback`, and `React.memo` at heavy render bounds.
- `perf-virtualization-large-lists` - Virtualize long lists and data tables using windowing techniques.
- `perf-bundle-chunk-splitting` - Configure dynamic dynamic module imports and vendor chunking.

### 10. Testing & Quality (Vitest, RTL, Playwright) (MEDIUM-HIGH)

- `test-targeted-feature-execution` - Run unit/component tests for affected feature modules during development (`pnpm --filter web test src/features/<feature>/*`).
- `test-full-suite-on-demand` - Run full test suites only before PR merging, shared contract edits, or infrastructure refactoring.
- `test-rtl-user-centric` - Write component tests using `@testing-library/user-event` and ARIA queries.
- `test-custom-hooks-render-hook` - Test custom hooks in isolation with `renderHook` and mock providers.
- `test-msw-api-mocking` - Mock REST API endpoints reliably using Mock Service Worker (MSW).
- `test-playwright-page-objects` - Model E2E user flows using Playwright Page Object Model.

---

## Detailed Architecture: Feature List Table & Infinite Scroll

Every feature list table component in `apps/web/src/features/<feature>/components/<entity>-list-table.tsx` MUST follow this structure:

```tsx
import { useMemo, useState } from 'react';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useDebounce } from '@/hooks/use-debounce';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { FindEntitySchema, type EntityAttribute } from '@repo/contracts';
import { useEntityInfiniteQuery } from '../hooks/use-entity-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function EntityListTable() {
  // 1. URL Filter Sync & Debounced Search
  const { values, setValues } = useUrlFilters(FindEntitySchema);
  const debouncedSearch = useDebounce(values.search, 800);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize: 20,
    }),
    [debouncedSearch, values]
  );

  // 2. TanStack Query Infinite Data Fetching
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEntityInfiniteQuery(queryParams);

  // 3. Page Array Flattening
  const accumulatedData = useMemo<EntityAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // 4. Bottom Sentinel for Infinite Scroll
  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className="space-y-4">
      {/* Search & Top Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={values.search ?? ''}
            onChange={(e) => setValues({ search: e.target.value })}
            placeholder="Search records..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table Presentation */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-slate-500">
                  No records found matching filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Sentinel */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          `All ${data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length} records loaded`
        ) : null}
      </div>
    </div>
  );
}
```

For full details, see the dedicated standalone sub-skills:
- [`feature-list-table`](file:///e:/work/neayouk/.agents/skills/feature-list-table/SKILL.md)
- [`infinite-scroll-table`](file:///e:/work/neayouk/.agents/skills/infinite-scroll-table/SKILL.md)
- [`targeted-feature-testing`](file:///e:/work/neayouk/.agents/skills/targeted-feature-testing/SKILL.md)
