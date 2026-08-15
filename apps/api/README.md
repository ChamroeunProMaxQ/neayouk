# NestJS API (`apps/api`)

A progressive, scalable NestJS server-side application built with Node.js ESM (`"type": "module"`), TypeORM, Zod validation, CASL authorization, and full observability integration.

## 🚀 Features

- **NestJS 12 & Node ESM**: Uses modern ECMAScript Modules with NodeNext module resolution.
- **Shared Zod Validation**: Consumes DTO schemas from `@repo/contracts` via `nestjs-zod` for single-source-of-truth validation across API and Web client.
- **Unified API Response Shape**: All endpoint responses and errors are intercepted and normalized into a consistent envelope `{ status, message, data, pagination }`.
- **Database & Migrations**: TypeORM with MySQL support, alongside Umzug for database migrations and data seeding.
- **Auth & Authorization**: Passport JWT authentication coupled with CASL (`nest-casl`) for fine-grained role/attribute-based access control.
- **Full Observability Suite**:
  - **Tracing**: OpenTelemetry auto-instrumentation exportable via OTLP HTTP.
  - **Metrics**: Prometheus metrics exposed via `@willsoto/nestjs-prometheus` and `prom-client`.
  - **Logs**: Structured logging powered by `winston` and `winston-loki`.
- **Testing**: Fast e2e and unit testing using Vitest.

---

## 🛠️ Scripts & Usage

From the project root or inside `apps/api`:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start API in watch mode (`nest start --watch --preserveWatchOutput`) |
| `pnpm build` | Build production output using Nest CLI (`nest build`) |
| `pnpm start:prod` | Run built API from `dist/main.js` |
| `pnpm migrate` | Run database migrations via Umzug (`dist/database/migrator.js`) |
| `pnpm seed` | Execute database seeders (`dist/database/seeder.js`) |
| `pnpm lint` | Lint code using `oxlint` |
| `pnpm test` | Run e2e tests using Vitest |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run Vitest coverage report |

### Running E2E Tests via Turbo
```bash
# Run tests across the workspace
pnpm test

# Run specific API e2e test with Vitest
pnpm --filter api exec vitest run test/app.e2e-spec.ts
```

---

## 📐 Architecture & Conventions

### 1. Shared DTOs & Validation
- Zod schemas live in `packages/shared/src/*.dto.ts` (e.g., `CreateUserSchema`).
- API DTO classes extend `createZodDto`:
  ```ts
  import { createZodDto } from 'nestjs-zod';
  import { CreateUserSchema } from '@repo/contracts';

  export class CreateUserDto extends createZodDto(CreateUserSchema) {}
  ```
- `ZodValidationPipe` is registered globally in `AppModule`, automatically validating all body/query payloads against these schemas.

### 2. Standardized Response Envelope
All responses are formatted as:
```json
{
  "status": 200,
  "message": "success",
  "data": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 50,
    "totalPages": 5
  }
}
```
- Custom response messages can be set on controllers using the `@HttpMessage('...')` decorator.
- `HttpExceptionsFilter` catches all exceptions (including Zod validation errors) and formats them into this exact response shape.

### 3. ESM Import Convention (`.js` Extension)
Because this package operates under NodeNext ESM resolution, **all relative imports in `.ts` files must include explicit `.js` extensions**:
```ts
import { AppModule } from './app.module.js'; // Correct
import { AppModule } from './app.module';    // Will throw ERR_MODULE_NOT_FOUND at runtime
```

---

## 🧪 Manual API Testing

A ready-to-use REST client request file is located at [`apps/api/http/user.http`](file:///e:/work/neayouk/apps/api/http/user.http). You can execute these endpoints directly using VS Code / WebStorm REST Client plugins.
