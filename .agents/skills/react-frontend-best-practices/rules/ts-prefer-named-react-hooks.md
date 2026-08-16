# Prefer Named React Hooks and Type Imports Over `React.*` Namespace

This rule enforces using **named imports** for React hooks and types (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `type FC`, `type ReactNode`) instead of namespaced member access (`React.useState`, `React.useEffect`, `React.FC`).

---

## Core Directives

1. **Always Use Named Imports for Hooks**: Import hooks directly from `"react"` (`import { useState, useEffect } from 'react';`).
2. **Prohibit `React.*` Namespace**: Never write `React.useState`, `React.useEffect`, `React.useMemo`, or `React.FC`.
3. **Explicit Type Imports**: Import types with `type` specifier (`import { type FC, type ReactNode } from 'react';`).
