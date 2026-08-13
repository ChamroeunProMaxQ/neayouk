---
title: Organize Code by Feature Modules Over Technical Layer Buckets
impact: CRITICAL
impactDescription: Prevents shotgun debugging across distant technical directories when working on features.
tags: architecture, feature-folder, modularity
---

## Organize Code by Feature Modules Over Technical Layer Buckets

**Impact: CRITICAL (Improves developer productivity and codebase discoverability)**

Structuring frontend projects by technical layer buckets (`components/`, `hooks/`, `api/`, `types/`) at the root level forces developers to jump between 5 different folders to work on a single domain feature. 

Organize code by **Feature Modules** under `src/features/<feature-name>/`, where each feature encapsulates its own presentation components, hooks, state, types, and API calls. Only truly global utilities, shared design system primitives, and layout shells reside in `src/shared/` or `src/components/ui/`.

**Incorrect (Technical layer bucket layout):**

```
src/
├── api/
│   ├── auth.ts
│   ├── checkout.ts
│   └── product.ts
├── components/
│   ├── AuthModal.tsx
│   ├── CheckoutSummary.tsx
│   └── ProductCard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCheckout.ts
│   └── useProduct.ts
└── types/
    ├── auth.ts
    ├── checkout.ts
    └── product.ts
```

**Correct (Feature-driven modular layout):**

```
src/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth-api.ts
│   │   ├── components/
│   │   │   └── auth-modal.tsx
│   │   ├── hooks/
│   │   │   └── use-auth-mutation.ts
│   │   ├── types/
│   │   │   └── auth-types.ts
│   │   └── index.ts               # Public barrel export for feature
│   │
│   ├── checkout/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   └── products/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── shared/                       # Shared cross-cutting modules
│   ├── api/                      # Axios/fetch base client configuration
│   ├── components/               # Layout shells, headers, footers
│   ├── hooks/                    # Generic hooks (use-debounce, use-media-query)
│   └── lib/                      # Helper functions (cn, formatters)
│
└── components/
    └── ui/                       # Atomic shadcn/ui primitives (button, dialog, input)
```

**Feature Index Barrel Export Pattern (`src/features/auth/index.ts`):**

```typescript
// Explicitly expose only public components and hooks to rest of application
export { AuthModal } from './components/auth-modal';
export { useAuth } from './hooks/use-auth';
export type { UserSession } from './types/auth-types';
```

Reference: [Bulletproof React Architecture](https://github.com/alan2207/bulletproof-react)
