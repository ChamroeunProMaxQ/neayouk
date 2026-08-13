---
title: Consume Shared Monorepo `@repo/contracts` Package in NestJS Modules
impact: CRITICAL
impactDescription: Eliminates duplicate DTO schemas and guarantees end-to-end API type safety with React frontend.
tags: architecture, monorepo, contract, nestjs, zod
---

## Consume Shared Monorepo `@repo/contracts` Package in NestJS Modules

**Impact: CRITICAL (Ensures backend NestJS controllers and DTOs adhere strictly to shared monorepo contracts)**

In a full-stack monorepo application, declaring duplicate request/response DTOs or validation logic inside NestJS controllers independently from the React frontend leads to API specification mismatches and runtime validation bugs.

Import single-source-of-truth Zod schemas (`LogInSchema`), DTO types (`LogInDto`, `UserDto`), and route constants (`API_ROUTE`) directly from `@repo/contracts` (`packages/contracts/src/*.ts`). Use NestJS Zod validation pipes to validate request payloads seamlessly against shared contracts.

**Incorrect (Duplicating DTO schemas locally inside NestJS app):**

```typescript
// ❌ Bad: Hardcoded route strings and locally duplicated DTOs drift from frontend
import { Controller, Post, Body } from '@nestjs/common';

export class LocalLogInDto {
  username: string;
  password: string;
}

@Controller('api/v1/auth') // Hardcoded string vulnerable to typos
export class AuthController {
  @Post('login')
  async login(@Body() body: LocalLogInDto) {
    // Process login...
  }
}
```

**Correct (Consuming `@repo/contracts` in NestJS Controllers and Validation Pipes):**

```typescript
// ✅ Good: Shared monorepo contract imports
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { LogInSchema, type LogInDto, API_ROUTE, ResponseDto } from '@repo/contracts';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';

@Controller(API_ROUTE.USER.CREATE) // Route path from shared contract
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(LogInSchema)) // Validate against shared Zod contract schema
  async createUser(@Body() dto: LogInDto): Promise<ResponseDto<string>> {
    const userId = await this.userService.createUser(dto);
    return {
      success: true,
      data: userId,
      message: 'User created successfully',
    };
  }
}
```

Reference: [NestJS Pipelines and Validation](https://docs.nestjs.com/pipes#class-validator)
