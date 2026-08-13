---
title: Validate Build and Runtime Environment Variables with Zod
impact: LOW-MEDIUM
impactDescription: Prevents silent production runtime crashes caused by missing or invalid .env parameters.
tags: tooling, environment, env-validation, zod, security
---

## Validate Build and Runtime Environment Variables with Zod

**Impact: LOW-MEDIUM (Prevents subtle runtime failures caused by missing environment variables)**

Accessing `import.meta.env.VITE_API_URL` or `process.env.NEXT_PUBLIC_API_URL` directly across application components without validation leads to silent failures or `undefined/api/users` request URLs in production if a `.env` variable is missing or malformed.

Validate environment variables at build and startup time using **Zod** schema parsing (`env.ts` / `env.mjs`).

**Incorrect (Direct unvalidated import.meta.env access):**

```typescript
// ❌ Bad: If VITE_API_URL is missing, fetch calls silently hit 'undefined/users'
export async function getUsers() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/users`);
  return res.json();
}
```

**Correct (Type-safe Zod schema environment validation module):**

```typescript
// src/shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Client-side environment variables
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

function parseEnv() {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    console.error('❌ Invalid Environment Variables Configuration:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Application startup aborted.');
  }

  return result.data;
}

// Export validated, type-safe env object
export const env = parseEnv();
```

**Clean Application Usage:**

```typescript
import { env } from '@/shared/config/env';

// ✅ Good: Guaranteed to be valid URL string at runtime; full TypeScript autocomplete
const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
});
```

Reference: [t3-oss - @t3-oss/env-core / Zod Env Validation](https://env.t3.gg/)
