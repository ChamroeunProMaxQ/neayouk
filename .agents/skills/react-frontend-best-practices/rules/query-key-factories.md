---
title: Use Centralized Query Key Factories for Structured Cache Invalidation
impact: HIGH
impactDescription: Prevents hardcoded query key string typos and enables precise cache invalidation.
tags: query, tanstack-query, caching, query-keys
---

## Use Centralized Query Key Factories for Structured Cache Invalidation

**Impact: HIGH (Eliminates cache invalidation bugs and query key string mismatches)**

Hardcoding query key arrays like `['users', userId]` or `['user', 'detail', id]` inline across components leads to typos and broken invalidation logic when calling `queryClient.invalidateQueries()`.

Define centralized **Query Key Factories** per feature domain to construct type-safe, hierarchical query key tuples.

**Incorrect (Hardcoding inline array strings):**

```tsx
// ❌ Bad: Typing different array strings breaks invalidation logic
// File A:
useQuery({ queryKey: ['user-detail', id], queryFn: fetchUser });

// File B (Mutation invalidation fails because key doesn't match 'user-detail'):
queryClient.invalidateQueries({ queryKey: ['users', id] });
```

**Correct (Centralized hierarchical Query Key Factory):**

```typescript
// features/users/api/user-query-keys.ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage in Query Hook:
export function useUserDetail(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUserById(id),
  });
}

// Usage in Mutation Invalidation:
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: (updatedUser) => {
      // ✅ Invalidate specific detail query key deterministically
      queryClient.invalidateQueries({ queryKey: userKeys.detail(updatedUser.id) });
      // ✅ Invalidate all user lists to refresh tables
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

Reference: [TkDodo's blog - Practical React Query: Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
