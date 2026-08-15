---
title: Enforce Contract-Based Zod Schema & DTO Sharing Across Frontend Forms and Backend Endpoints
impact: CRITICAL
impactDescription: Guarantees 100% type safety and validation synchronization between React Hook Form and NestJS DTOs using shared Zod schemas from @repo/contracts.
tags: forms, react-hook-form, zod, dto, contracts, nestjs, full-stack, typescript
---

## Enforce Contract-Based Zod Schema & DTO Sharing Across Frontend Forms and Backend Endpoints

**Impact: CRITICAL (Eliminates validation drift, duplicate interfaces, and runtime data mismatch between frontend forms and backend APIs)**

Writing inline Zod schemas or manual TypeScript interfaces in frontend form components or backend controllers creates fragmented validation rules that drift out of sync. 

In a modern full-stack monorepo, **Zod schemas defined in `@repo/contracts` serve as the single source of truth** for both frontend forms (React Hook Form) and backend DTOs (NestJS controllers and validation pipes).

---

### Core Standard & Architecture

1. **Shared Contract (`packages/contracts/src/*.dto.ts`)**:
   - Define validation schemas using `z.object({...})`.
   - Export inferred DTO types via `export type MyDto = z.infer<typeof MySchema>`.
2. **Frontend Forms (`src/components/` / `src/features/`)**:
   - Import the exact `MySchema` and `type MyDto` from `@repo/contracts`.
   - Pass `zodResolver(MySchema)` into React Hook Form's `useForm<MyDto>({ resolver: zodResolver(MySchema) })`.
   - Submit inferred `MyDto` payload via TanStack Query mutation hooks.
3. **Backend NestJS Controllers (`src/modules/`)**:
   - Import `MySchema` and `type MyDto` from `@repo/contracts`.
   - Bind `@UsePipes(new ZodValidationPipe(MySchema))` to route handlers.
   - Type request body parameter as `@Body() dto: MyDto`.

---

### Anti-Patterns to Avoid ❌

```tsx
// ❌ Bad 1: Locally re-defining Zod schemas in React form components
import { z } from 'zod';

const LocalLoginFormSchema = z.object({
  username: z.string().min(3), // Backend contract might require email or min 5 chars!
  password: z.string().min(6),
});

// ❌ Bad 2: Re-writing parallel TypeScript interfaces for form data
interface LocalLoginFormValues {
  username: string;
  password: string;
}
```

---

### Standard Production Pattern ✅

#### 1. Define Contract Schema & DTO (`packages/contracts/src/auth.dto.ts`)

> **Zod 4.4.3 API Standard**: Always use named import `import { z } from 'zod'` and infer types using `z.infer<typeof Schema>`.

```typescript
import { z } from "zod";

export const LogInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LogInDto = z.infer<typeof LogInSchema>;
```

#### 2. Frontend Form Component (`apps/web/src/features/auth/components/login-form.tsx`)

> [!IMPORTANT]
> **Zod v4 Resolver Compatibility (`result.error.issues` vs `result.error.errors`)**:
> In **Zod v4**, validation issues are stored on `result.error.issues` (whereas Zod v3 stored them on `result.error.errors`).
> Standard `@hookform/resolvers/zod` was built for Zod v3 and looks for `result.error.errors`, which evaluates to `undefined` in Zod v4.
> Consequently, the resolver returns `{ errors: {} }` (empty errors), causing React Hook Form to see no errors and silently halt submission without rendering the error messages.
> Always use the project's Zod v4-compatible resolver helper `@/shared/lib/zod-resolver`.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/shared/lib/zod-resolver';
import { LogInSchema, type LogInDto, API_ROUTE } from '@repo/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  onSubmit: (data: LogInDto) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  // ✅ Good: Single-source-of-truth Zod schema & DTO type from @repo/contracts
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInDto>({
    resolver: zodResolver(LogInSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Input {...register('username')} placeholder="Username" />
        {errors.username && (
          <p className="mt-1 text-xs text-destructive font-semibold">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Input {...register('password')} type="password" placeholder="Password" />
        {errors.password && (
          <p className="mt-1 text-xs text-destructive font-semibold">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
```

#### 3. Backend NestJS Controller (`apps/api/src/modules/auth/auth.controller.ts`)

```typescript
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { LogInSchema, type LogInDto, API_ROUTE, type LogInResponseDto } from '@repo/contracts';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(API_ROUTE.AUTH.LOGIN)
  @UsePipes(new ZodValidationPipe(LogInSchema)) // ✅ Good: Validates against contract Zod schema
  async login(@Body() dto: LogInDto): Promise<LogInResponseDto> {
    return this.authService.login(dto);
  }
}
```

---

### Key Takeaways

1. **Zero Drift**: Updating field length, regex rules, or optional flags in `@repo/contracts` automatically updates form validation error messages in React and API payload validation in NestJS simultaneously.
2. **Build-Time Safety**: Adding or renaming fields in `@repo/contracts` causes instant TypeScript compilation errors across form components and backend controllers until updated.
3. **No Code Duplication**: Frontend components never write `z.object({...})` for API-backed forms; they only reference `@repo/contracts`.
4. **Zod v4 Compatibility**: Use `@/shared/lib/zod-resolver` to properly extract `result.error.issues` into `formState.errors` for React Hook Form.

Reference: [React Hook Form - Zod Resolver](https://react-hook-form.com/docs/useform#resolver) | [Turborepo - Sharing Code Across Packages](https://turbo.build/repo/docs/core-concepts/monorepos/sharing-code)

