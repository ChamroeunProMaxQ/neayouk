---
title: Ensure Pure React Component Exports in `.tsx` Files for Vite Fast Refresh
impact: MEDIUM-HIGH
impactDescription: Prevents Vite HMR invalidation warnings and full page reloads when editing component or route files.
tags: react, vite, fast-refresh, hmr, routing, react-router
---

## Ensure Pure React Component Exports in `.tsx` Files for Vite Fast Refresh

**Impact: MEDIUM-HIGH (Prevents lost state and forced browser reloads during local development)**

Vite's `@vitejs/plugin-react` uses React Fast Refresh to update edited components in the browser without losing component state. Fast Refresh requires files ending in `.tsx` or `.jsx` to export **only React components** (PascalCase functions).

Exporting non-component variables—such as a `createBrowserRouter([...])` instance object (`export const router = ...`) or mock data arrays (`export const initialCustomers = ...`)—causes Fast Refresh to fail and fall back to HMR invalidation (`[vite] (client) hmr invalidate ... Could not Fast Refresh`).

**Incorrect (Exporting non-component objects or data arrays from `.tsx` files):**

```tsx
// ❌ Bad: Exporting router object and data array causes Fast Refresh HMR invalidation
import { createBrowserRouter } from 'react-router-dom';

export const initialUsers = [ ... ]; // Non-component export!

export const router = createBrowserRouter([ ... ]); // Non-component export!
```

**Correct (Exporting pure React component wrappers & keeping data constants unexported or in `.ts` files):**

```tsx
// ✅ Good: Exporting a React component wrapper for RouterProvider & keeping data private
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const initialUsers = [ ... ]; // Internal component data (or move to data.ts)

const router = createBrowserRouter([ ... ]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

Reference: [Vite React Plugin - Consistent Component Exports](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports)
