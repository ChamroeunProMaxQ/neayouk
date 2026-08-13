---
title: Enforce Strict TypeScript Options and Ban `any` Casts
impact: CRITICAL
impactDescription: Prevents type bypasses, uncaught undefined/null crashes, and silent runtime failures.
tags: typescript, type-safety, strict-mode
---

## Enforce Strict TypeScript Options and Ban `any` Casts

**Impact: CRITICAL (Eliminates runtime NullPointerExceptions and broken API contracts)**

Using `any` or disabling strict mode in TypeScript completely invalidates the guarantees of the compiler, exposing production users to runtime crashes like `Cannot read properties of undefined`.

Always configure strict compiler flags in `tsconfig.json` and prohibit `any` in favor of `unknown`, generic parameters, or explicit interface definitions.

**TypeScript Compiler Requirements (`tsconfig.json`):**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  }
}
```

**Incorrect (Bypassing types with `any` and unsafe indexing):**

```typescript
// ❌ Bad: any swallows type mismatch errors; unchecked indexing crashes at runtime
function processResponse(data: any) {
  console.log(data.user.profile.name.toUpperCase()); // Crashes if profile is undefined
}

const cache: Record<string, any> = {};
const item = cache['missing_key'];
item.doSomething(); // Runtime TypeError
```

**Correct (Type-safe validation with `unknown` and `noUncheckedIndexedAccess`):**

```typescript
// ✅ Good: Use unknown + type narrowing or Zod validation
interface UserProfile {
  name: string;
  email: string;
}

function processResponse(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as Record<string, unknown>).name === 'string'
  ) {
    return (data as { name: string }).name.toUpperCase();
  }
  throw new Error('Invalid user payload structure');
}

// ✅ Good: Handling index signatures with optional checks
const cache: Record<string, UserProfile> = {};
const item = cache['missing_key']; // Type is UserProfile | undefined

if (item) {
  console.log(item.name); // Type-safe access
}
```

Reference: [TypeScript Strict Documentation](https://www.typescriptlang.org/tsconfig#strict)
