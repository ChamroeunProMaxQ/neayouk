---
title: Implement Optimistic UI Updates with Rollback Context on Failure
impact: HIGH
impactDescription: Delivers instant UI feedback while maintaining strict cache integrity on network failures.
tags: query, tanstack-query, optimistic-updates, UX
---

## Implement Optimistic UI Updates with Rollback Context on Failure

**Impact: HIGH (Provides zero-latency responsive UX for mutations like likes, toggles, and item additions)**

Waiting for full network round-trips before updating the UI introduces noticeable latency for quick user interactions (like toggling a task checkbox or bookmarking a post).

Use TanStack Query's `onMutate`, `onError`, and `onSettled` mutation callbacks to optimistically update the query cache immediately, while capturing snapshot data to seamlessly roll back state if the server request fails.

**Incorrect (Waiting for network response before updating UI):**

```tsx
// ❌ Bad: 500ms delay before UI updates checkbox state
export function useToggleTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleTodoApi,
    onSuccess: () => {
      // User experiences visible delay waiting for server response
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}
```

**Correct (Optimistic update with snapshot rollback handling):**

```typescript
export function useToggleTodoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTodoApi,
    // 1. Triggered before network request starts
    onMutate: async (todoToToggle) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: todoKeys.list() });

      // Snapshot previous query data value for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.list());

      // Optimistically update query cache immediately
      queryClient.setQueryData<Todo[]>(todoKeys.list(), (old = []) =>
        old.map((todo) =>
          todo.id === todoToToggle.id ? { ...todo, completed: !todo.completed } : todo
        )
      );

      // Return context object containing snapshot
      return { previousTodos };
    },
    // 2. If network request fails, roll back to snapshot
    onError: (err, todoToToggle, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.list(), context.previousTodos);
      }
      toast.error('Failed to update todo status');
    },
    // 3. Always refetch after error or success to synchronize with server truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.list() });
    },
  });
}
```

Reference: [TanStack Query Optimistic Updates Guide](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
