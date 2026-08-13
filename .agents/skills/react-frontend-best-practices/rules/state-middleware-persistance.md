---
title: Safely Configure Zustand Persist Middleware with Typed Storage and Partialize
impact: HIGH
impactDescription: Prevents SSR hydration mismatches and accidental persistence of sensitive or transient state.
tags: state, zustand, persistence, middleware
---

## Safely Configure Zustand Persist Middleware with Typed Storage and Partialize

**Impact: HIGH (Prevents storage leaks, hydration bugs, and unauthorized localStorage data persistence)**

Using Zustand's `persist` middleware without `partialize` persists 100% of the store—including temporary flags, action functions, or sensitive tokens—into `localStorage`. Furthermore, accessing `localStorage` directly during SSR or initial hydration causes client/server React mismatch warnings.

Always use `partialize` to explicitly whitelist persisted keys, define typed storage wrappers, and handle hydration gracefully.

**Incorrect (Unfiltered persistence into localStorage):**

```typescript
// ❌ Bad: Persists everything (including isLoading and function actions) directly
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false, // Should NOT be persisted!
      login: (u) => set({ user: u }),
    }),
    { name: 'user-storage' }
  )
);
```

**Correct (Filtered persistence with `partialize` and hydration safety):**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserSettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  isNavExpanded: boolean; // Transient UI property excluded from storage
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: number) => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 14,
      isNavExpanded: true,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'app-user-settings-v1', // Namespace storage key
      storage: createJSONStorage(() => localStorage),
      // ✅ Good: Only persist specific state slice keys
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
      }),
    }
  )
);
```

Reference: [Zustand Persist Middleware Documentation](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
