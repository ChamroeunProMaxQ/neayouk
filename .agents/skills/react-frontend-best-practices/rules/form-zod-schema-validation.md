---
title: Enforce Schema-First Form Validation with React Hook Form and Zod
impact: HIGH
impactDescription: Guarantees full type inference from validation schemas into form inputs and handlers.
tags: forms, react-hook-form, zod, validation, contracts
---

## Enforce Schema-First Form Validation with React Hook Form and Zod

**Impact: HIGH (Prevents invalid data submission and centralizes form error messaging via `@repo/contracts`)**

Writing custom inline validation functions or duplicating Zod schemas inside frontend component folders leads to fragmented validation rules and fragile type casts when backend rules change.

Import single-source-of-truth Zod schemas (e.g. `LogInSchema`) and DTO types (`LogInDto`) directly from `@repo/contracts`, and bind them to React Hook Form using `@hookform/resolvers/zod`.

**Incorrect (Manual inline form validation with loose state):**

```tsx
// ❌ Bad: Manual state tracking and locally duplicated validation rules
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrors({ email: 'Invalid email' });
      return;
    }
    // Submit loose data...
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Correct (Schema-first validation importing Zod schema from `@repo/contracts`):**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogInSchema, type LogInDto, API_ROUTE } from '@repo/contracts';

export function LoginForm({ onSubmit }: { onSubmit: (data: LogInDto) => void }) {
  // ✅ Good: Schema and DTO imported directly from workspace @repo/contracts
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInDto>({
    resolver: zodResolver(LogInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register('username')} placeholder="Username" />
        {errors.username && (
          <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Input {...register('password')} type="password" placeholder="Password" />
        {errors.password && (
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
```

Reference: [React Hook Form - Resolvers (Zod)](https://react-hook-form.com/docs/useform#resolver)
