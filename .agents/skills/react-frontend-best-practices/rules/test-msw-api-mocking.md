---
title: Mock REST API Endpoints Reliably using Mock Service Worker (MSW v2)
impact: MEDIUM-HIGH
impactDescription: Intercepts network requests at the network layer without patching global fetch/axios.
tags: testing, msw, mock-service-worker, api-mocking, vitest
---

## Mock REST API Endpoints Reliably using Mock Service Worker (MSW v2)

**Impact: MEDIUM-HIGH (Provides real network-level mocking without patching global fetch or axios)**

Mocking `axios.get` or `global.fetch` using `vi.spyOn` or `vi.mock` is fragile: it bypasses network stack logic, fails to catch header/query string bugs, and often leaks mock implementations across unrelated tests.

Use **Mock Service Worker (MSW v2)** to intercept HTTP network requests seamlessly at the network layer across Vitest unit/component tests and browser development.

**Incorrect (Fragile monkey-patching of global fetch or axios):**

```typescript
// ❌ Bad: Fragile global module mock that leaks state between test files
vi.mock('axios');
axios.get.mockResolvedValue({ data: { id: '1' } });
```

**Correct (Standardized MSW v2 network handler definition):**

```typescript
// 1. Define Request Handlers (src/mocks/handlers.ts)
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Intercept GET /api/users/:id
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    if (id === 'not-found') {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      spentAmount: 15000,
    });
  }),

  // Intercept POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === 'error@example.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({ token: 'mock-jwt-token-xyz' });
  }),
];

// 2. Configure Vitest Test Server Lifecycle (src/mocks/server.ts)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// setupTests.ts (Vitest setup file)
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Reference: [Mock Service Worker (MSW v2) Documentation](https://mswjs.io/docs/)
