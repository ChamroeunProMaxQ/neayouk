---
name: react-frontend-best-practices
description: Production-grade React frontend best practices and architecture patterns for experienced developers. Covers Layer-based architecture, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, React Router, Vitest, Testing Library, Playwright, oxlint, oxfmt, and monorepo @repo/contracts integration.
license: MIT
metadata:
  author: Kadajett
  version: "1.1.0"
---

# React Frontend Best Practices

Comprehensive best practices guide for building scalable, production-ready React web applications. Contains 41 rules across 10 categories, prioritized by impact to guide automated refactoring, code generation, and team alignment.

## Selected Stack Architecture

- **Framework**: React 18/19
- **Language**: TypeScript (Strict Mode)
- **Shared Monorepo Package**: `@repo/contracts` (Single source of truth for Zod schemas, DTO types, and `API_ROUTE` constants)
- **UI**: Tailwind CSS + shadcn/ui (Radix UI, `cva`, `cn`)
- **Client State**: Zustand
- **Server State & API**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Routing**: React Router
- **Unit & Component Testing**: Vitest + React Testing Library + MSW
- **E2E Testing**: Playwright
- **Linter & Formatter**: oxlint + oxfmt
- **Architecture Pattern**: Layer-based (Presentation, Application/Hooks, Domain, Data/API, Shared/UI)

## When to Apply

Reference these guidelines when:

- Consuming shared `@repo/contracts` schemas and route path constants
- Designing component hierarchies and feature modules
- Implementing global client state (Zustand) or server caching (TanStack Query)
- Building accessible forms with React Hook Form and Zod validation
- Structuring API abstraction layers and custom query hooks
- Setting up routes, data loaders, code splitting, and guards
- Reviewing PRs for type safety, performance, and UI responsiveness
- Writing unit, component, or end-to-end integration tests

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture & Layering | CRITICAL | `arch-` |
| 2 | TypeScript & Type Safety | CRITICAL | `ts-` |
| 3 | Client State (Zustand) | HIGH | `state-` |
| 4 | Server State & API (TanStack Query) | HIGH | `query-` |
| 5 | Forms & Validation (RHF + Zod) | HIGH | `form-` |
| 6 | UI & Styling (Tailwind + shadcn/ui) | HIGH | `ui-` |
| 7 | Routing & Data (React Router) | MEDIUM-HIGH | `route-` |
| 8 | Performance Optimization | MEDIUM-HIGH | `perf-` |
| 9 | Testing (Vitest, RTL, Playwright) | MEDIUM-HIGH | `test-` |
| 10 | Tooling & Quality (oxlint, oxfmt) | LOW-MEDIUM | `tooling-` |

## Quick Reference

### 1. Architecture & Layering (CRITICAL)

- `arch-shared-contract-package` - Consume shared monorepo `@repo/contracts` for schemas, DTOs, and route paths
- `arch-layer-separation` - Enforce strict presentation, application, domain, and data layer separation
- `arch-feature-folder-structure` - Organize code by feature modules instead of file-type buckets
- `arch-decouple-ui-from-state` - Keep presentation components pure and delegate business logic to hooks
- `arch-component-colocation` - Co-locate tests, styles, subcomponents, and types with their feature

### 2. TypeScript & Type Safety (CRITICAL)

- `ts-strict-types-no-any` - Enforce strict mode and prohibit explicit or implicit `any`
- `ts-discriminated-unions` - Model complex UI variants and async state with discriminated unions
- `ts-type-safe-props-generics` - Define explicit component prop contracts and generic components
- `ts-utility-types-inference` - Infer types directly from Zod schemas and `@repo/contracts` to eliminate duplication

### 3. Client State (Zustand) (HIGH)

- `state-atomic-selectors` - Use fine-grained atomic selectors to prevent unnecessary component re-renders
- `state-slice-pattern` - Split large global stores into modular, domain-focused slices
- `state-transient-vs-persistent` - Isolate transient UI state from persistent global application state
- `state-middleware-persistance` - Configure typed store persistence with safe hydration strategies

### 4. Server State & API (TanStack Query) (HIGH)

- `query-key-factories` - Use centralized query key factories for structured cache invalidation
- `query-custom-hooks` - Encapsulate all queries and mutations inside typed custom hooks using `@repo/contracts`
- `query-optimistic-updates` - Implement optimistic updates with context rollback on failure
- `query-stale-cache-management` - Define explicit `staleTime` and `gcTime` strategies per query type

### 5. Forms & Validation (React Hook Form + Zod) (HIGH)

- `form-zod-schema-validation` - Define schema-first validation importing Zod schemas from `@repo/contracts`
- `form-rhf-controller-integration` - Integrate custom shadcn/ui components using RHF `Controller`
- `form-performance-uncontrolled` - Utilize uncontrolled inputs to avoid re-renders on keystrokes
- `form-field-arrays-dynamic` - Manage dynamic field lists efficiently using `useFieldArray`

### 6. UI & Styling (Tailwind + shadcn/ui) (HIGH)

- `ui-shadcn-primitives` - Extend shadcn/ui components without breaking accessible Radix primitives
- `ui-tanstack-table-primitives` - Always use TanStack Table (v8) with shadcn UI primitive components for data tables
- `ui-cn-cva-variants` - Create type-safe component variants using `cva` and `cn` utilities
- `ui-responsive-fluid-layouts` - Build mobile-first responsive layouts with semantic Tailwind utilities
- `ui-theme-tokens-design-system` - Manage dark mode and color palettes via design tokens

### 7. Routing & Data (React Router) (MEDIUM-HIGH)

- `route-loaders-actions` - Fetch data and handle submissions in parallel using loaders and actions
- `route-code-splitting-lazy` - Code-split route segments using `React.lazy` and Suspense
- `route-search-params-state` - Sync filterable/searchable UI states with URL query params
- `route-guards-layout-nesting` - Use layout routes for authentication guards and shared view shells
- `route-fast-refresh-component-exports` - Ensure pure React component exports in `.tsx` files for Vite Fast Refresh

### 8. Performance Optimization (MEDIUM-HIGH)

- `perf-memoization-boundaries` - Apply `useMemo`, `useCallback`, and `React.memo` at heavy render bounds
- `perf-virtualization-large-lists` - Virtualize long lists and data tables using windowing techniques
- `perf-image-media-optimization` - Load optimized images lazily with explicit layout dimensions
- `perf-bundle-chunk-splitting` - Configure dynamic dynamic module imports and vendor chunking

### 9. Testing (Vitest, RTL, Playwright) (MEDIUM-HIGH)

- `test-rtl-user-centric` - Write component tests using `@testing-library/user-event` and ARIA queries
- `test-custom-hooks-render-hook` - Test custom hooks in isolation with `renderHook` and mock providers
- `test-msw-api-mocking` - Mock REST API endpoints reliably using Mock Service Worker (MSW)
- `test-playwright-page-objects` - Model E2E user flows using Playwright Page Object Model

### 10. Tooling & Quality (oxlint, oxfmt) (LOW-MEDIUM)

- `tooling-oxlint-rules` - Configure fast `oxlint` rules for React, JSX A11y, and TypeScript
- `tooling-oxfmt-formatting` - Enforce zero-overhead automated code formatting with `oxfmt`
- `tooling-environment-env-validation` - Validate build and runtime environment variables with Zod

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/arch-shared-contract-package.md
rules/arch-layer-separation.md
rules/state-atomic-selectors.md
rules/query-key-factories.md
rules/_sections.md
```

Each rule file contains:
- Brief explanation of why the rule matters
- Incorrect code example highlighting the anti-pattern
- Correct code example presenting production-ready patterns using `@repo/contracts`
- Context, references, and tool ecosystem integration notes
