---
title: Consume Shared Monorepo `@repo/contracts` Package for End-to-End Type Safety
impact: CRITICAL
impactDescription: Prevents type duplication and guarantees full frontend-backend API contract synchronization.
tags: architecture, monorepo, contract, typescript, zod
---

## Consume Shared Monorepo `@repo/contracts` Package for End-to-End Type Safety

**Impact: CRITICAL (Eliminates API contract drift and duplicate type definitions between React and NestJS)**

In a monorepo workspace, manually defining TypeScript interfaces or Zod validation schemas inside frontend component folders creates duplicate definitions that easily drift out of sync when backend API endpoints, validation rules, or response DTO shapes change.

Consume shared Zod schemas (`LogInSchema`), TypeScript DTO types (`LogInDto`, `UserDto`), and API route constants (`API_ROUTE`) directly from the workspace `@repo/contracts` package (`packages/contracts/src/*.ts`).

**Incorrect (Re-declaring API routes and Zod schemas locally in frontend):**

```typescript
// ❌ Bad: Locally defined schema and route paths drift when backend updates
import { z } from 'zod';

export const LocalLogInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const LOGIN_URL = '/api/v1/auth/login'; // Hardcoded path prone to typos
```

**Correct (Consuming `@repo/contracts` single source of truth):**

```typescript
// ✅ Good: Shared monorepo contract imports
import { LogInSchema, LogInDto, API_ROUTE, ResponseDto } from '@repo/contracts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Form integration using contract Zod schema & inferred DTO type
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogInDto>({
    resolver: zodResolver(LogInSchema),
  });

  const onSubmit = async (data: LogInDto) => {
    // 2. Fetch using shared contract API_ROUTE constant
    const response = await apiClient.post<ResponseDto<string>>(API_ROUTE.USER.CREATE, data);
    console.log(response.data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

Reference: [Turborepo - Sharing Code Across Packages](https://turbo.build/repo/docs/core-concepts/monorepos/sharing-code)
