---
title: Model Complex UI and Async State using Discriminated Unions
impact: CRITICAL
impactDescription: Prevents impossible state combinations like isLoading: true with data: null and error: Error.
tags: typescript, discriminated-unions, state-modeling
---

## Model Complex UI and Async State using Discriminated Unions

**Impact: CRITICAL (Eliminates impossible UI states and forces exhaustive switch/case handling)**

Representing state with independent optional properties (`{ isLoading?: boolean, data?: User, error?: Error }`) creates invalid state combinations—such as `isLoading: true` while simultaneously having `data` and `error` defined.

Use **Discriminated Unions** containing a shared literal property (e.g. `status: 'idle' | 'loading' | 'success' | 'error'`) to make impossible states unrepresentable in TypeScript.

**Incorrect (Optional fields permitting impossible states):**

```typescript
// ❌ Bad: Permitting invalid states like { isLoading: true, error: Error('failed') }
interface AsyncState<T> {
  isLoading: boolean;
  isError: boolean;
  data?: T;
  error?: Error;
}

function renderUI(state: AsyncState<User>) {
  if (state.isLoading) return <Spinner />;
  // Compiler doesn't know data exists here; requires non-null assertion !
  return <div>{state.data!.name}</div>; 
}
```

**Correct (Discriminated union forcing strict state coverage):**

```typescript
// ✅ Good: Discriminated union type
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderUI(state: AsyncState<User>) {
  switch (state.status) {
    case 'idle':
      return <EmptyState />;
    case 'loading':
      return <Spinner />;
    case 'success':
      // state.data is guaranteed to be present and typed as User
      return <div>{state.data.name}</div>;
    case 'error':
      // state.error is guaranteed to be present
      return <ErrorMessage message={state.error.message} />;
  }
}
```

**Polymorphic UI Variant Example:**

```tsx
// ✅ Good: Discriminated props for component variants
type ButtonProps =
  | { variant: 'link'; href: string; onClick?: never }
  | { variant: 'button'; onClick: () => void; href?: never };

export function CustomButton(props: ButtonProps) {
  if (props.variant === 'link') {
    return <a href={props.href}>Link</a>;
  }
  return <button onClick={props.onClick}>Button</button>;
}
```

Reference: [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
