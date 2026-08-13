# Sections

This file defines all 10 sections, their ordering, impact levels, and descriptions for the React Frontend Best Practices skill.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Architecture & Layering (arch)

**Impact:** CRITICAL
**Description:** Layer-based architecture isolates presentation, application logic, domain rules, and data access. Integrating the shared monorepo `@repo/contracts` package ensures single-source-of-truth type safety between React and NestJS apps.

## 2. TypeScript & Type Safety (ts)

**Impact:** CRITICAL
**Description:** Strict TypeScript configurations prevent runtime crashes, guarantee API contract consistency, and enable confident refactoring across the codebase.

## 3. Client State (Zustand) (state)

**Impact:** HIGH
**Description:** Managing client UI state with Zustand requires atomic selectors, store slices, and clear boundary separation from server state to prevent unintended re-renders.

## 4. Server State & API (TanStack Query) (query)

**Impact:** HIGH
**Description:** TanStack Query handles server state caching, invalidation, deduplication, and optimistic updates. Standardized query keys and hooks consume `@repo/contracts` API routes and types.

## 5. Forms & Validation (React Hook Form + Zod) (form)

**Impact:** HIGH
**Description:** Schema-driven validation using Zod schemas imported from `@repo/contracts` combined with React Hook Form guarantees performant, type-safe form state handling.

## 6. UI & Styling (Tailwind CSS + shadcn/ui) (ui)

**Impact:** HIGH
**Description:** Scalable UI design systems leverage shadcn/ui primitives, Radix UI headless accessibility, Tailwind utility tokens, and class variance authority (`cva`).

## 7. Routing & Data (React Router) (route)

**Impact:** MEDIUM-HIGH
**Description:** React Router handles application layout structures, nested routes, client-side data loaders, action submissions, route guards, and code splitting.

## 8. Performance Optimization (perf)

**Impact:** MEDIUM-HIGH
**Description:** React performance relies on strategic memoization boundaries, virtualization of large lists, media optimization, and efficient bundle chunking.

## 9. Testing (Vitest, RTL, Playwright) (test)

**Impact:** MEDIUM-HIGH
**Description:** Comprehensive testing combines user-centric component tests (Vitest + RTL), isolated custom hook tests, MSW API mocks, and Playwright E2E automation.

## 10. Tooling & Quality (oxlint, oxfmt) (tooling)

**Impact:** LOW-MEDIUM
**Description:** High-speed linting (`oxlint`) and zero-overhead formatting (`oxfmt`) enforce code style, JSX accessibility rules, and environment variable safety across developer environments.
