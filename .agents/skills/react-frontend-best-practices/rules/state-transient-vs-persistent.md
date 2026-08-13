---
title: Isolate Local Transient UI State from Global Application State
impact: HIGH
impactDescription: Prevents global state pollution with transient, single-component state like modal flags or input toggles.
tags: state, zustand, react, useState
---

## Isolate Local Transient UI State from Global Application State

**Impact: HIGH (Keeps global store minimal and prevents state bloat)**

Not every piece of state belongs in a global Zustand store. Storing transient, localized UI states—such as a single dropdown's open/close status, form input hover highlights, or accordion item toggles—in global state pollutes the store and introduces unintended coupling across unrelated pages.

**State Classification Hierarchy:**
1. **Local Transient UI State (`useState` / `useReducer`)**: Dropdown open/close, hover state, tab index, temporary input focus.
2. **Global Client State (Zustand)**: Authenticated user session, theme preferences, layout sidebar state, active active filter presets across routes.
3. **Server State (TanStack Query)**: Remote API records, cached user profiles, dynamic lists, background sync status.

**Incorrect (Storing local dropdown open state in global store):**

```tsx
// ❌ Bad: Putting single component's dropdown open flag into global Zustand store
const useStore = create((set) => ({
  isDropdownOpen: false,
  setDropdownOpen: (open) => set({ isDropdownOpen: open }),
}));

export function ProfileDropdown() {
  const isOpen = useStore((s) => s.isDropdownOpen);
  const setOpen = useStore((s) => s.setDropdownOpen);
  return <Dropdown isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />;
}
```

**Correct (Local component state for local UI lifecycle):**

```tsx
// ✅ Good: Use standard React useState for transient component UI
import { useState } from 'react';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen((prev) => !prev)}>Profile</Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-popover p-2 shadow-md">
          <DropdownItem href="/profile">My Account</DropdownItem>
          <DropdownItem href="/settings">Settings</DropdownItem>
        </div>
      )}
    </div>
  );
}
```

Reference: [Thinking in React - Identifying State](https://react.dev/learn/thinking-in-react#step-3-find-the-minimal-but-complete-representation-of-ui-state)
