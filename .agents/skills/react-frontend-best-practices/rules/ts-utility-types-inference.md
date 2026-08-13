---
title: Infer Types from Zod Schemas and API Contracts to Eliminate Duplication
impact: HIGH
impactDescription: Prevents type drift between runtime validation schemas, API responses, and TypeScript interfaces.
tags: typescript, zod, inference, utility-types
---

## Infer Types from Zod Schemas and API Contracts to Eliminate Duplication

**Impact: HIGH (Single source of truth for validation schemas and types)**

Manually declaring a TypeScript `interface` alongside a matching Zod schema or API payload creates duplicate code that easily drifts out of sync when requirements change.

Leverage `z.infer<typeof schema>` to generate TypeScript types directly from validation schemas, and use built-in utility types (`Pick`, `Omit`, `ReturnType`, `Awaited`) to derive types from existing contracts.

**Incorrect (Duplicating interface and Zod schema manually):**

```typescript
// ❌ Bad: Interface and Zod schema will drift when fields update
export interface UserFormInput {
  name: string;
  email: string;
  age: number;
}

export const userFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
});
```

**Correct (Inferring type automatically from single schema source of truth):**

```typescript
import { z } from 'zod';

// 1. Define single schema source of truth
export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  role: z.enum(['admin', 'user', 'guest']),
});

// 2. Infer TypeScript type from schema automatically
export type UserFormInput = z.infer<typeof userFormSchema>;

// 3. Inferring API response type using Awaited and ReturnType
export async function getProductCatalog() {
  const response = await apiClient.get<ProductDTO[]>('/products');
  return response.data;
}

// Single source of truth for returned catalog item array
export type ProductCatalogResponse = Awaited<ReturnType<typeof getProductCatalog>>;
export type ProductItem = ProductCatalogResponse[number];
```

Reference: [Zod Type Inference](https://zod.dev/?id=type-inference)
