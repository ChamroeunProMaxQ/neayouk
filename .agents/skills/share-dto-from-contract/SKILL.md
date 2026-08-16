---
name: share-dto-from-contract
description: Enforce that all Data Transfer Objects (DTOs), Zod schemas, API payload interfaces, response structures, query parameters, enums, and route path constants are defined in and exported from the shared '@repo/contracts' package, strictly prohibiting local DTO duplication across NestJS backend and React frontend apps.
---

# Share DTO from Contract

This skill enforces that **`@repo/contracts` (`packages/contracts/src/`) is the sole single source of truth for all Data Transfer Objects (DTOs), Zod validation schemas, API payload interfaces, pagination parameters, response envelopes, enums, and route paths across the entire monorepo.**

Neither backend NestJS apps (`apps/api`) nor frontend React apps (`apps/web`) may create, re-declare, or duplicate local payload interfaces or validation classes independently.

---

## Core Directives

### 1. Contract Package as Single Source of Truth (`@repo/contracts`)
- All entity request/response schemas, DTOs, query parameters, and mutations **MUST** be written as Zod schemas inside `packages/contracts/src/<domain>.dto.ts`.
- Export both the Zod schema (`export const CreateUserSchema = z.object(...)`) and inferred TypeScript types (`export type CreateUserDto = z.infer<typeof CreateUserSchema>`).
- Export all domain schemas, DTO types, enums, and route paths from `packages/contracts/src/index.ts`.

### 2. NestJS Backend DTO Integration (`apps/api`)
- NestJS DTO classes **MUST** extend `createZodDto(SchemaFromContracts)` from `nestjs-zod`.
- **NEVER** write standalone NestJS DTO classes with `@IsString()`, `@IsNotEmpty()`, `@ApiProperty()`, or manual TypeScript interfaces.
- Controller input validation **MUST** use global `ZodValidationPipe` or route-level validation pipes tied to `@repo/contracts` schemas.
- Path parameter or query string DTOs (e.g. pagination, filters, sorting) **MUST** inherit from contracts schemas (`PaginationSchema`, `createSortSchema(...)`).

### 3. React Frontend Integration (`apps/web`)
- Frontend forms **MUST** use `zodResolver(SchemaFromContracts)` from `@hookform/resolvers/zod` with Zod schemas imported directly from `@repo/contracts`.
- React Query custom hooks (`useQuery`, `useMutation`, `useInfiniteQuery`) **MUST** use inferred type aliases (`CreateUserDto`, `FindUsersDto`, `UserAttribute`, `ResponseDto<T>`) imported directly from `@repo/contracts`.
- API client calls (Axios or custom fetchers) **MUST** type request bodies and response data strictly with `@repo/contracts` types.

### 4. Shared API Enums, Constants, and Route Paths
- All shared domain enums (`UserTypeEnum`, `UserStatusEnum`, `ActionEnum`, `ResourceEnum`, `TokenEnum`) **MUST** be defined in `packages/contracts/src/*.enum.ts` and consumed in both API (entities, guards, services) and Web (components, state stores).
- API endpoint route path constants (`API_ROUTE`) **MUST** be defined in `packages/contracts/src/route.ts` and consumed by both NestJS `@Controller(API_ROUTE...)` and frontend API requests.

### 5. Unified Response Envelope (`ResponseDto` & `PaginatedResponseDto`)
- All API controller endpoints return data wrapped in `ResponseDto<T>` or `PaginatedResponseDto<T>` exported from `@repo/contracts`.
- Global `ResponseInterceptor` and `HttpExceptionsFilter` ensure payload compliance with `@repo/contracts`.

---

## Quick Reference Comparison

| Standard / Pattern | Anti-Pattern (Prohibited ❌) | Contract-Driven (Mandatory ✅) |
|---|---|---|
| **NestJS DTO** | `class CreateUserDto { @IsString() name: string; }` | `class CreateUserDto extends createZodDto(CreateUserSchema) {}` |
| **Frontend Form** | Local Zod schema `const schema = z.object({ ... })` inside form component | `import { CreateUserSchema } from '@repo/contracts'` |
| **API Response Type** | Interface `interface UserResponse { id: number; username: string; }` duplicated in React app | `import type { UserAttribute, ResponseDto } from '@repo/contracts'` |
| **Query Params / Pagination** | Hardcoded query types `export interface FindParams { page: number }` | `import { PaginationSchema, type FindUsersDto } from '@repo/contracts'` |
| **Domain Enums** | Local enum `enum Role { ADMIN = 'ADMIN' }` in `apps/web` or `apps/api` | `import { UserTypeEnum } from '@repo/contracts'` |
| **Route Endpoints** | String literal `@Controller('api/v1/users')` or `axios.get('/api/v1/users')` | `import { API_ROUTE } from '@repo/contracts'` |

---

## Standard Implementation Workflow & Code Examples

### Step 1: Define Zod Schema and DTO Types in `@repo/contracts`

Create or update the contract file in `packages/contracts/src/<domain>.dto.ts`:

```typescript
// packages/contracts/src/product.dto.ts
import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";

// Base Entity Attribute Schema
export const ProductSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type ProductAttribute = z.infer<typeof ProductSchema>;

// Create Payload Schema & DTO Type
export const CreateProductSchema = ProductSchema.pick({
  sku: true,
  name: true,
  price: true,
  stock: true,
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

// Update Payload Schema & DTO Type
export const UpdateProductSchema = CreateProductSchema.partial();

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// Query / Filter / Pagination Schema & DTO Type
export const FindProductsSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'name', 'price', 'stock'], 'id'),
  search: z.string().optional(),
});

export type FindProductsDto = z.infer<typeof FindProductsSchema>;
```

Export everything in `packages/contracts/src/index.ts`:

```typescript
// packages/contracts/src/index.ts
export * from "./product.dto.js";
```

> **Note**: Build `@repo/contracts` after updating (`pnpm --filter @repo/contracts build`).

---

### Step 2: Consume Contract in NestJS Backend (`apps/api`)

#### A. Define NestJS DTO Class (`apps/api/src/product/dto/create-product.dto.ts`)

```typescript
import { CreateProductSchema, UpdateProductSchema, FindProductsSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class FindProductsDto extends createZodDto(FindProductsSchema) {}
```

#### B. Consume DTO in NestJS Controller (`apps/api/src/product/product.controller.ts`)

```typescript
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { API_ROUTE, type ProductAttribute, type ResponseDto, type PaginatedResponseDto } from '@repo/contracts';
import { ProductService } from './product.service.js';
import { CreateProductDto, UpdateProductDto, FindProductsDto } from './dto/create-product.dto.js';

@Controller(API_ROUTE.PRODUCT.BASE)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ResponseDto<ProductAttribute>> {
    const product = await this.productService.create(dto);
    return {
      status: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  @Get()
  async findAll(@Query() query: FindProductsDto): Promise<PaginatedResponseDto<ProductAttribute>> {
    return this.productService.findAll(query);
  }
}
```

---

### Step 3: Consume Contract in React Frontend (`apps/web`)

#### A. Form Validation with `react-hook-form` & `zodResolver`

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductSchema, type CreateProductDto } from '@repo/contracts';

export const CreateProductForm = ({ onSubmit }: { onSubmit: (data: CreateProductDto) => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductDto>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      stock: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Product Name</label>
        <input {...register('name')} className="input" />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        Create Product
      </button>
    </form>
  );
};
```

#### B. React Query Hooks & API Call Integration

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTE, type CreateProductDto, type ProductAttribute, type ResponseDto } from '@repo/contracts';
import { axiosClient } from '@/lib/axios-client';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductDto): Promise<ProductAttribute> => {
      const response = await axiosClient.post<ResponseDto<ProductAttribute>>(API_ROUTE.PRODUCT.CREATE, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
```

---

## Key Enforcement Checklist

- [ ] **Zero local DTO files using `class-validator`**: No `@IsString()`, `@IsInt()`, or `@IsOptional()` standard class-validator decorators in NestJS apps.
- [ ] **Zero duplicated Zod schemas in `apps/web`**: All form schemas import directly from `@repo/contracts`.
- [ ] **Zod Schema Inference**: All TypeScript type names (`CreateXDto`, `UpdateXDto`, `FindXDto`, `XAttribute`) are inferred via `z.infer<typeof Schema>` in `@repo/contracts`.
- [ ] **NestJS DTO creation**: All NestJS DTOs inherit from `createZodDto(ContractSchema)`.
- [ ] **Contract Rebuilding**: When modifying Zod schemas in `packages/contracts`, execute `pnpm --filter @repo/contracts build` so that `@repo/contracts/dist` stays in sync during local build processes.
