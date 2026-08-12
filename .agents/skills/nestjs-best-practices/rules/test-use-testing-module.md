---
title: Use Vitest for Unit Tests
impact: HIGH
impactDescription: Enables fast, isolated testing of pure logic and NestJS services with Vitest
tags: testing, unit-tests, mocking, vitest
---

## Use Vitest for Unit Tests

Prefer **Vitest** over Jest for fast, native ESM unit testing. Separate pure unit tests (e.g., utility & helper functions) from framework services:

1. **Helper & Utility Functions**: Test directly without creating NestJS `@nestjs/testing` modules for ultra-fast execution (<10ms).
2. **NestJS Services & Controllers**: Use `@nestjs/testing` module with `Test.createTestingModule` to inject mocked dependencies via Vitest primitives (`vi.fn()`, `vi.Mocked<T>`).

**Incorrect (manual instantiation bypassing DI for complex Nest services or using real DB):**

```typescript
// Manual instantiation of services requiring DB repositories hits real database!
describe('UsersService', () => {
  it('should create user', async () => {
    const repo = new UserRepository(); // Real repo!
    const service = new UsersService(repo);

    const user = await service.create({ name: 'Test' });
    // This hits the real database!
  });
});
```

**Correct (Pure Helper Unit Testing):**

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.helper.js';

describe('password.helper', () => {
  it('should hash and compare passwords correctly', () => {
    const hash = hashPassword('myPassword123');
    expect(comparePassword('myPassword123', hash)).toBe(true);
    expect(comparePassword('wrongPassword', hash)).toBe(false);
  });
});
```

**Correct (NestJS Service Unit Testing with Vitest mocks):**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi, type Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            save: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(UserRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should save and return user', async () => {
      const dto = { name: 'John', email: 'john@test.com' };
      const expectedUser = { id: '1', ...dto };

      repo.save.mockResolvedValue(expectedUser);

      const result = await service.create(dto);

      expect(result).toEqual(expectedUser);
      expect(repo.save).toHaveBeenCalledWith(dto);
    });

    it('should throw on duplicate email', async () => {
      repo.findOne.mockResolvedValue({ id: '1', email: 'test@test.com' });

      await expect(
        service.create({ name: 'Test', email: 'test@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

// Testing guards and interceptors with Vitest mocks
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow when no roles required', () => {
    const context = createMockExecutionContext({ user: { roles: [] } });
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });
});

function createMockExecutionContext(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
  } as ExecutionContext;
}
```

Reference: [Vitest Guide](https://vitest.dev/guide/) | [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
