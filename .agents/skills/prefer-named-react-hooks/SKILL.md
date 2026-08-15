---
name: prefer-named-react-hooks
description: Enforce using named imports for React hooks and utilities (useState, useEffect, useMemo, useCallback, useRef, etc.) instead of accessing them through the React namespace (React.useState, React.useEffect).
---

# Prefer Named React Hooks and Imports Over `React.*` Namespace

This skill enforces using **named imports** for React hooks and types (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `useContext`, `type FC`, `type ReactNode`, etc.) instead of namespaced member access (`React.useState`, `React.useEffect`, `React.FC`).

---

## Core Directives

1. **Always Use Named Imports for Hooks**:
   Import hooks directly from `"react"`:
   ```tsx
   import { useState, useEffect, useCallback, useMemo, useRef } from "react";
   ```
2. **Never Use Namespaced `React.` Hook Access**:
   Prohibit `React.useState(...)`, `React.useEffect(...)`, `React.useMemo(...)`, `React.useCallback(...)`, `React.useRef(...)`, `React.useId(...)`, `React.useTransition(...)`, `React.useDeferredValue(...)`.
3. **Use Explicit Named Type Imports for React Types**:
   When typing components, children, or DOM elements, use named type imports with `type`:
   ```tsx
   import { useState, type FC, type ReactNode, type ChangeEvent, type FormEvent } from "react";
   ```
   Avoid `React.FC<Props>`, `React.ReactNode`, `React.ChangeEvent<HTMLInputElement>`.
4. **Automated Clean-Up**:
   When adding or refactoring React components, check existing imports and consolidate them into a clean named import list from `"react"`.

---

## Quick Reference Table

| Anti-Pattern (`React.*`) ❌ | Standard Named Import (Recommended) ✅ |
|---|---|
| `React.useState<T>(initial)` | `import { useState } from "react";`<br>`useState<T>(initial)` |
| `React.useEffect(() => {}, [])` | `import { useEffect } from "react";`<br>`useEffect(() => {}, [])` |
| `React.useCallback(() => {}, [])` | `import { useCallback } from "react";`<br>`useCallback(() => {}, [])` |
| `React.useMemo(() => value, [])` | `import { useMemo } from "react";`<br>`useMemo(() => value, [])` |
| `React.useRef<HTMLDivElement>(null)` | `import { useRef } from "react";`<br>`useRef<HTMLDivElement>(null)` |
| `React.useContext(ThemeContext)` | `import { useContext } from "react";`<br>`useContext(ThemeContext)` |
| `React.useId()` | `import { useId } from "react";`<br>`useId()` |
| `React.useTransition()` | `import { useTransition } from "react";`<br>`useTransition()` |
| `React.forwardRef(...)` | `import { forwardRef } from "react";`<br>`forwardRef(...)` |
| `const MyComp: React.FC<Props> = ...` | `import { type FC } from "react";`<br>`const MyComp: FC<Props> = ...` (or type props directly `({ prop }: Props)`) |
| `children: React.ReactNode` | `import { type ReactNode } from "react";`<br>`children: ReactNode` |

---

## Code Examples

### ❌ Anti-Pattern: Namespaced `React.*`

```tsx
import React from "react";

export const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  const fullName = React.useMemo(() => {
    return user ? `${user.firstName} ${user.lastName}` : "";
  }, [user]);

  const handleReset = React.useCallback(() => {
    setUser(null);
  }, []);

  return <div>{/* UI */}</div>;
};
```

---

### ✅ Recommended Pattern: Named Imports

```tsx
import { useState, useEffect, useMemo, useCallback, useRef, type FC } from "react";

interface UserProfileProps {
  userId: string;
}

export const UserProfile: FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  const fullName = useMemo(() => {
    return user ? `${user.firstName} ${user.lastName}` : "";
  }, [user]);

  const handleReset = useCallback(() => {
    setUser(null);
  }, []);

  return <div>{/* UI */}</div>;
};
```

---

## Why This Matters

1. **Readability & Consistency**: Reduces visual noise across component code and eliminates boilerplate prefixes.
2. **Modern Tooling & Tree-Shaking**: Aligns with modern bundler optimizations (ESM / Rollup / Vite / SWC).
3. **Linter & Formatter Alignment**: Simplifies static analysis rules (`oxlint`, `eslint-plugin-react-hooks`) which track hook call stacks more effectively.
4. **Code Uniformity**: Prevents mixed usage where some hooks in the same file use `useState` and others use `React.useState`.
