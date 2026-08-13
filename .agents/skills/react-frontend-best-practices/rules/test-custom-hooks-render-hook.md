---
title: Test Stateful Custom Hooks in Isolation using `renderHook` and Provider Wrappers
impact: MEDIUM-HIGH
impactDescription: Enables fast, direct unit testing of custom hook logic without rendering full UI components.
tags: testing, vitest, renderHook, custom-hooks, query-provider
---

## Test Stateful Custom Hooks in Isolation using `renderHook` and Provider Wrappers

**Impact: MEDIUM-HIGH (Enables fast, targeted unit testing of complex hook state logic)**

Attempting to test custom hooks (like custom TanStack Query hooks, Zustand store hooks, or complex form hooks) by mounting full mock UI components introduces unnecessary DOM overhead and obscures hook assertion results.

Use React Testing Library's `renderHook()` utility to execute hooks in isolation, and wrap them in a custom wrapper component containing required context providers (`QueryClientProvider`, `MemoryRouter`).

**Incorrect (Creating dummy mock components just to test hook logic):**

```tsx
// ❌ Bad: Creating a full test component just to invoke hook
function TestComponent() {
  const { data } = useUserQuery('123');
  return <div data-testid="user">{data?.name}</div>;
}
```

**Correct (Isolated hook testing with `renderHook` and provider wrapper):**

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { useUserQuery } from './use-user-query';

// 1. Create clean test provider wrapper helper
function createTestQueryWrapper() {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
}

describe('useUserQuery Custom Hook', () => {
  it('fetches user profile data successfully', async () => {
    // 2. Render hook in isolation with wrapper
    const { result } = renderHook(() => useUserQuery('user-123'), {
      wrapper: createTestQueryWrapper(),
    });

    // Initial state check
    expect(result.current.isLoading).toBe(true);

    // 3. Wait for async state transition
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 4. Assert hook return values
    expect(result.current.data).toEqual({
      id: 'user-123',
      displayName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
```

Reference: [React Testing Library - renderHook Documentation](https://testing-library.com/docs/react-testing-library/api/#renderhook)
