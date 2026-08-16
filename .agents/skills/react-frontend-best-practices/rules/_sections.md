# Sections

This file defines all sections, their ordering, impact levels, and descriptions for the React Frontend Best Practices skill.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Architecture & Layering (arch)

**Impact:** CRITICAL
**Description:** Layer-based architecture isolates presentation, application logic, domain rules, and data access. Integrating the shared monorepo `@repo/contracts` package ensures single-source-of-truth type safety between React and NestJS apps.

## 2. TypeScript & Type Safety (ts)

**Impact:** CRITICAL
**Description:** Strict TypeScript configurations prevent runtime crashes, guarantee API contract consistency, and enable confident refactoring across the codebase. Includes named hooks (`ts-prefer-named-react-hooks.md`).

## 3. Client State (Zustand) (state)

**Impact:** HIGH
**Description:** Managing client UI state with Zustand requires atomic selectors, store slices, and clear boundary separation from server state to prevent unintended re-renders.

## 4. Server State & API (TanStack Query & Axios) (query)

**Impact:** HIGH
**Description:** TanStack Query handles server state caching, invalidation, deduplication, and optimistic updates. Centralized Axios client (`query-prefer-axios-over-fetch.md`) handles HTTP status rejection, interceptors, and typed payloads using `@repo/contracts`.

## 5. Feature List Tables & Infinite Scroll (ui / table)

**Impact:** HIGH
**Description:** Mandatory architecture for data tables (`ui-feature-list-table.md` & `ui-infinite-scroll-table.md`) using TanStack Table v8, `useInfiniteQuery`, page array flattening (`useMemo`), debounced search, `useUrlFilters` sync, and bottom intersection sentinels.

## 6. Forms & Validation (React Hook Form + Zod) (form)

**Impact:** HIGH
**Description:** Schema-driven validation using Zod schemas imported from `@repo/contracts` combined with React Hook Form guarantees performant, type-safe form state handling.

## 7. UI & Styling (Tailwind CSS + shadcn/ui) (ui)

**Impact:** HIGH
**Description:** Scalable UI design systems leverage shadcn/ui primitives (`ui-prefer-shadcn-ui.md`), Radix UI headless accessibility, Tailwind utility tokens, and class variance authority (`cva`).

## 8. Routing & Data (React Router) (route)

**Impact:** MEDIUM-HIGH
**Description:** React Router handles application layout structures, nested routes, client-side data loaders, action submissions, route guards, and code splitting.

## 9. Performance Optimization & Code Style (perf / code)

**Impact:** MEDIUM-HIGH
**Description:** React performance relies on strategic memoization boundaries, early returns / guard clauses (`code-prefer-early-return.md`), virtualization of large lists, media optimization, and efficient bundle chunking.

## 10. Testing & Quality (Vitest, RTL, Playwright) (test)

**Impact:** MEDIUM-HIGH
**Description:** Comprehensive testing combines targeted feature test execution (`test-targeted-feature-testing.md`), user-centric component tests (Vitest + RTL), isolated custom hook tests, MSW API mocks, and Playwright E2E automation.
