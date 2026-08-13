---
title: Encapsulate All TanStack Queries and Mutations inside Custom Hooks
impact: HIGH
impactDescription: Prevents leak of fetch logic, options, and query key configurations into UI components.
tags: query, tanstack-query, custom-hooks, encapsulation
---

## Encapsulate All TanStack Queries and Mutations inside Custom Hooks

**Impact: HIGH (Keeps UI components clean and standardizes query configuration defaults)**

Invoking `useQuery` or `useMutation` directly inside UI components duplicates query options (`staleTime`, `retry`, `select`, `enabled`) across multiple components and tightly couples UI markup to low-level data fetching options.

Encapsulate every query and mutation inside a named custom hook (e.g. `useUserQuery`, `useUpdateProfileMutation`).

**Incorrect (Inlining useQuery options directly in UI component):**

```tsx
// ❌ Bad: Component contains inline queryFn, queryKey, and staleTime options
export function UserProfileHeader({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => axios.get(`/api/users/${userId}`).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  if (isLoading) return <Skeleton />;
  return <h1>{data.name}</h1>;
}
```

**Correct (Encapsulated custom hook):**

```tsx
// 1. Custom Hook Definition (features/users/hooks/use-user-query.ts)
export function useUserQuery(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUserById(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache fresh duration
    enabled: Boolean(userId) && (options?.enabled ?? true),
    select: (data) => ({
      id: data.id,
      displayName: `${data.firstName} ${data.lastName}`,
      avatarUrl: data.avatar,
    }),
  });
}

// 2. Clean Presentation Component Usage
export function UserProfileHeader({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserQuery(userId);

  if (isLoading || !user) return <Skeleton className="h-8 w-48" />;

  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatarUrl} alt={user.displayName} />
      <h1 className="text-xl font-bold">{user.displayName}</h1>
    </div>
  );
}
```

Reference: [TkDodo's blog - Custom Hooks in React Query](https://tkdodo.eu/blog/react-query-as-a-state-manager#custom-hooks)
