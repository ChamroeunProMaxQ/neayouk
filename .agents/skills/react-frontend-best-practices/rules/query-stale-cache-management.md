---
title: Define Explicit `staleTime` and `gcTime` Strategies Per Data Classification
impact: HIGH
impactDescription: Eliminates aggressive background refetching loops and prevents memory leaks from unused caches.
tags: query, tanstack-query, performance, cache
---

## Define Explicit `staleTime` and `gcTime` Strategies Per Data Classification

**Impact: HIGH (Prevents API server flooding and optimizes client memory usage)**

By default, TanStack Query sets `staleTime` to `0`, causing queries to consider data immediately stale and refetch background data on every component mount, window focus, or network re-connection.

Configure appropriate `staleTime` and `gcTime` (Garbage Collection Time) defaults globally, and adjust them per data classification category:
- **Static / Infrequently Changed Data** (e.g. user roles, country codes): `staleTime: 60 * 60 * 1000` (1 hour).
- **Standard Application Data** (e.g. product listings, order history): `staleTime: 5 * 60 * 1000` (5 minutes).
- **Real-time / High Frequency Data** (e.g. live chat messages, stock prices): `staleTime: 0`.

**Incorrect (Default zero staleTime causing constant refetch loops):**

```typescript
// ❌ Bad: Default QueryClient configuration refetches on every single window focus
const queryClient = new QueryClient(); // staleTime defaults to 0ms!
```

**Correct (Structured QueryClient defaults and per-query overrides):**

```typescript
// 1. Global QueryClient Baseline Defaults (shared/lib/react-query.ts)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default fresh time
      gcTime: 1000 * 60 * 60 * 24, // Keep inactive cache items for 24 hours
      refetchOnWindowFocus: false, // Prevent surprising background fetches on tab switch
      retry: (failureCount, error) => {
        // Don't retry 404 or 401 HTTP response errors
        if (isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// 2. Specific Custom Query Hook Adjustments
export function useCountryCodesQuery() {
  return useQuery({
    queryKey: ['reference-data', 'countries'],
    queryFn: fetchCountriesApi,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours (static reference data)
  });
}
```

Reference: [TkDodo's blog - Practical React Query: Important Defaults](https://tkdodo.eu/blog/practical-react-query#the-defaults-explained)
