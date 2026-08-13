---
title: Use Atomic Selectors with Zustand to Prevent Unnecessary Re-renders
impact: HIGH
impactDescription: Prevents entire component trees from re-rendering whenever unreferenced store properties change.
tags: state, zustand, performance, selectors
---

## Use Atomic Selectors with Zustand to Prevent Unnecessary Re-renders

**Impact: HIGH (Eliminates excessive re-renders across the component tree)**

By default, subscribing to a Zustand store without a selector (`const store = useStore()`) causes the component to re-render whenever *any* property inside the entire store updates.

Always extract primitive state values or function actions using fine-grained **atomic selectors** (`useStore((s) => s.targetValue)`), or use Zustand's `useShallow` hook when selecting multiple properties into an object.

**Incorrect (Subscribing to full store instance):**

```tsx
// ❌ Bad: Re-renders when user, theme, or items array changes, even though component only needs theme
import { useAppStore } from '@/stores/app-store';

export function ThemeToggle() {
  const store = useAppStore(); // Full store subscription

  return (
    <button onClick={store.toggleTheme}>
      Current theme: {store.theme}
    </button>
  );
}
```

**Correct (Atomic primitive selector and `useShallow`):**

```tsx
import { useAppStore } from '@/stores/app-store';
import { useShallow } from 'zustand/react/shallow';

// ✅ Good: Primitive atomic selectors (re-renders ONLY when `theme` changes)
export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}

// ✅ Good: Shallow multi-property selection
export function UserBadge() {
  const { userName, userAvatar } = useAppStore(
    useShallow((state) => ({
      userName: state.user.name,
      userAvatar: state.user.avatar,
    }))
  );

  return (
    <div className="flex items-center gap-2">
      <img src={userAvatar} alt={userName} className="h-6 w-6 rounded-full" />
      <span>{userName}</span>
    </div>
  );
}
```

Reference: [Zustand Auto-Generating Selectors](https://zustand.docs.pmnd.rs/guides/auto-generating-selectors)
