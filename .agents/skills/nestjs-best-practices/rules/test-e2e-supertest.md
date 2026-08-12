---
title: Use Supertest with Vitest Global Setup for E2E Testing
impact: HIGH
impactDescription: Validates full request/response cycle with fast global database lifecycle
tags: testing, e2e, supertest, vitest, integration
---

## Use Supertest with Vitest for E2E Testing

End-to-end (E2E) tests use Supertest to execute real HTTP requests against your NestJS application. To keep E2E tests fast and reliable:

1. **Global Database Lifecycle (`vitest.global-setup.ts`)**: Execute schema migrations (`migrator.up()`) and initial seeders (`seeder.up()`) **ONCE** at the start of the entire test run via Vitest `globalSetup`, and teardown **ONCE** at the end. Do NOT drop and recreate table schemas per test file.
2. **Single-Fork Sequential Runner**: Configure `vitest.config.e2e.ts` with `pool: 'forks'` and `singleFork: true` (or `fileParallelism: false`) to run E2E test files sequentially and prevent database migration collisions.
3. **Reusable E2E Setup Helper (`e2e-test.utils.ts`)**: Abstract `setupE2eApp()` and `teardownE2eApp()` to eliminate setup boilerplate across test suites.

**Incorrect (Re-migrating & dropping schema per test file):**

```typescript
// BAD: Re-migrating and dropping entire schema in every test file causes 20s+ slowdowns!
describe('UsersController (e2e)', () => {
  beforeAll(async () => {
    await migrator.up(); // Re-runs DDL per file!
    await seeder.up();
  });

  afterAll(async () => {
    await seeder.down({ to: 0 });
    await migrator.down({ to: 0 }); // Drops tables per file!
  });
});
```

**Correct (Vitest Global Setup + Reusable Helper):**

```typescript
// 1. vitest.global-setup.ts (Runs ONCE per test run)
import { migrator, seeder, dataSource } from '../database/umzug.js';

export async function setup() {
  await migrator.up();
  await seeder.up();
}

export async function teardown() {
  await seeder.down({ to: 0 });
  await migrator.down({ to: 0 });
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
```

```typescript
// 2. vitest.config.e2e.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/vitest.global-setup.ts'],
  },
});
```

```typescript
// 3. E2E Test Suite (Clean & Concise)
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;
    adminToken = ctx.createToken({ type: UserTypeEnum.ADMIN });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  describe('/api/v1/users (GET)', () => {
    it('should return users', async () => {
      const response = await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });
});
```

Reference: [Vitest Global Setup](https://vitest.dev/config/#globalsetup) | [NestJS E2E Testing](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing)
