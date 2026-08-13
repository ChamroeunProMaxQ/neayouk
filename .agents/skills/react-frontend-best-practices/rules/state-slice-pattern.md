---
title: Split Large Global Zustand Stores using the Slice Pattern
impact: HIGH
impactDescription: Prevents unwieldy monolithic store files and enables domain-driven state organization.
tags: state, zustand, architecture, slices
---

## Split Large Global Zustand Stores using the Slice Pattern

**Impact: HIGH (Keeps client state modular, maintainable, and domain-bounded)**

Putting all client state variables and actions into a single 500-line `useStore.ts` file leads to messy merge conflicts and hard-to-navigate code.

Structure complex Zustand state into modular **Slices** (e.g. `auth-slice.ts`, `ui-slice.ts`, `settings-slice.ts`) and combine them into a single bound store instance using Zustand's `StateCreator`.

**Incorrect (Monolithic store containing unrelated domains):**

```typescript
// ❌ Bad: Monolithic store mixing auth, cart, theme, and notification state
export const useAppStore = create((set) => ({
  user: null,
  cartItems: [],
  theme: 'light',
  notifications: [],
  setUser: (user) => set({ user }),
  addToCart: (item) => set((s) => ({ cartItems: [...s.cartItems, item] })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, n] })),
}));
```

**Correct (Slice Pattern modularization):**

```typescript
// 1. Auth Slice (stores/slices/auth-slice.ts)
import { StateCreator } from 'zustand';

export interface AuthSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<BoundStore, [], [], AuthSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// 2. UI Slice (stores/slices/ui-slice.ts)
export interface UISlice {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const createUISlice: StateCreator<BoundStore, [], [], UISlice> = (set) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
});

// 3. Combined Bound Store (stores/use-bound-store.ts)
export type BoundStore = AuthSlice & UISlice;

export const useBoundStore = create<BoundStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
}));
```

Reference: [Zustand Slice Pattern Guide](https://zustand.docs.pmnd.rs/guides/slices-pattern)
