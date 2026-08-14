# AGENTS.md

Instructions, architecture notes, operational commands, and coding guidelines for AI agents (Antigravity, Claude Code, Cursor, Copilot, etc.) working in this repository.

---

## 🏛️ Monorepo Architecture Overview

This repository is a production-grade full-stack TypeScript monorepo managed with **pnpm**, **Turborepo**, **NestJS 12**, **React 19**, **Vite 8**, and **Zod**.

### Directory Structure

```
d1-monorepo-template/
├── apps/
│   ├── api/                 # NestJS 12 REST API (Port 3000)
│   └── web/                 # React 19 + Vite 8 SPA Frontend (Port 5173)
├── packages/
│   └── contracts/           # Shared Zod schemas, DTO types, Enums, & Route constants (@repo/contracts)
└── infra/
    └── log-explorer/        # Observability Stack (Grafana, Loki, Prometheus, Tempo via Docker Compose)
```

### Workspaces Summary

| Workspace Path | Package Name | Description | Tech Stack |
| :--- | :--- | :--- | :--- |
| `apps/api` | `api` | Backend REST API | NestJS 12 (alpha), Node ESM, TypeORM + MySQL, Passport JWT, CASL, Winston/Loki, OpenTelemetry |
| `apps/web` | `web` | Frontend SPA | React 19, Vite 8 |
| `packages/contracts` | `@repo/contracts` | Shared Source of Truth | Zod schemas, inferred DTO types, Enums, Route constants |
| `infra/log-explorer` | N/A | Observability Stack | Grafana (`:13000`), Loki (`:3100`), Prometheus (`:9090`), Tempo (`:3200`) |

---

## 🛠️ Environment & Tooling Specifications

- **Package Manager**: `pnpm` (`^11.3`, auto-downloaded via `devEngines`).
- **Monorepo Manager**: `Turborepo` (`v2.10+`).
- **Module System**: Pure Node.js ESM across all workspaces (`"type": "module"`).
- **TypeScript**: `v5.9+` (`tsconfig.base.json` shared base config).
- **Linter**: `oxlint` (`v1.73+`).
- **Test Runner**: `Vitest` (`v4.1+`).

---

## 📜 Command Reference

Run commands from the repository root; Turborepo orchestrates workspace dependencies:

### Global Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Run all applications and watch tasks concurrently |
| `pnpm dev:api` | Start NestJS API server only (`nest start --watch`) |
| `pnpm dev:web` | Start Vite frontend dev server only (`vite`) |
| `pnpm build` | Build all workspace packages in topological order (`^build`) |
| `pnpm lint` | Run `oxlint` across all workspaces |
| `pnpm test` | Run API Vitest e2e tests |

### Workspace-Specific & Targeted Commands

```sh
# Build shared contracts package explicitly
pnpm --filter @repo/contracts build

# Execute database migrations (requires prior compilation of contracts & api)
pnpm --filter api migrate

# Execute database seeders
pnpm --filter api seed

# Run a specific Vitest test file in apps/api
pnpm --filter api exec vitest run test/app.e2e-spec.ts

# Run tests matching a specific pattern
pnpm --filter api exec vitest run -t "user controller"
```

---

## ⚠️ Non-Negotiable Coding Rules & Gotchas for AI Agents

### 1. Mandatory `.js` Import Extensions in `apps/api`
`apps/api` uses `NodeNext` ESM module resolution (`"moduleResolution": "NodeNext"`, `"verbatimModuleSyntax": true`).
- **Rule**: Every relative import or path alias import (`@src/*`, `@database/*`, `@test/*`) in `apps/api` **MUST include an explicit `.js` file extension**.
- ✅ `import { AppModule } from './app.module.js';`
- ✅ `import { swaggerConfig } from '@src/common/config/swagger.config.js';`
- ❌ `import { AppModule } from './app.module';` *(Fails at runtime)*

### 2. `@repo/contracts` as Single Source of Truth
- Shared Zod validation schemas live in `packages/contracts/src/*.dto.ts`.
- **Backend API DTOs**: Created using `nestjs-zod`:
  ```ts
  import { createZodDto } from 'nestjs-zod';
  import { CreateUserSchema } from '@repo/contracts';

  export class CreateUserDto extends createZodDto(CreateUserSchema) {}
  ```
- **Frontend Types**: Web app imports TypeScript types and schemas directly from `@repo/contracts`.
- **Do NOT** duplicate payload interfaces or validation logic separately in `apps/api` or `apps/web`.

### 3. Unified Response Envelope & Exceptions
- All successful responses and errors strictly conform to `ResponseDto`:
  ```json
  {
    "status": 200,
    "message": "success",
    "data": { ... },
    "pagination": { ... }
  }
  ```
- Global pipeline elements in `apps/api/src/app.module.ts`:
  - `ZodValidationPipe`: Validates incoming `@Body()` and `@Query()` payloads.
  - `ResponseInterceptor`: Wraps return payloads and generates pagination metadata when returning `{ count, rows }` for requests with `?page&pageSize`.
  - `HttpExceptionsFilter`: Formats all HTTP and validation exceptions into the `ResponseDto` structure.
  - `@HttpMessage('custom message')`: Customizes the response envelope message per controller or route.
- API endpoints are scoped under `/api` global prefix with URI versioning (`v1`), e.g., `/api/v1/users`.

### 4. Linter & Code Quality Rules
- Linter is **oxlint** (`pnpm lint`).
- Ignore `apps/api/eslint.config.mjs` and ESLint devDependencies (legacy remnants).
- Keep code clean, type-safe, and formatted.

### 5. Testing Framework
- Active test runner is **Vitest** (`apps/api/vitest.config.ts`), configured to execute `test/**/*.e2e-spec.ts`.
- Ignore legacy Jest configuration blocks in `apps/api/package.json`.

### 6. Dev Server Proxying
- API server runs on port `3000`.
- Web frontend runs on port `5173`.
- Vite proxies `/api` requests to `http://localhost:3000` (`apps/web/vite.config.ts`), enabling relative `/api/v1/...` calls from frontend code.

### 7. Database & Migrations
- Migration engine: **Umzug** with TypeORM + MySQL, compiled via **SWC**.
- Database directory is located at `apps/api/database` (at the same level as `src/`).
- Build strategy: SWC compiles `database/` to `apps/api/dist-db/` (separate from `nest build`'s `dist/`).
- CLI commands: `pnpm --filter api migrate up` and `pnpm --filter api seed up` automatically run SWC pre-hooks before execution.
- CLI Entrypoints (`migrator.ts` and `seeder.ts`) MUST destroy `dataSource` in a `finally` block after `runAsCLI()` to prevent hanging connection pools.
- Seeders MUST be idempotent (`INSERT IGNORE`) and disable foreign key checks (`SET FOREIGN_KEY_CHECKS = 0`) during rollback.

### 8. Data Tables: Always Use TanStack Table + Infinite Scroll + URL Query Params + shadcn Primitives
- **Rule**: Whenever creating, refactoring, or displaying tabular data in `apps/web`, ALWAYS use **TanStack Table** (`@tanstack/react-table` v8) with **Infinite Scroll** (NO Next/Previous pagination buttons), **URL query parameter synchronization** (`useSearchParams`), and **shadcn UI Table primitives** (`@/components/ui/table`).
- Every search input, filter dropdown, and column header sort toggle MUST push/sync to URL query parameters (`search`, `role`, `status`, `sortBy`, `sortOrder`).
- Refer to `.agents/skills/react-frontend-best-practices/rules/ui-tanstack-table-primitives.md` for complete guidelines.

---

## 🤖 Recommended Workflow for Task Execution

When adding new features or refactoring code:

1. **Define Schema**: Add or update Zod schemas in `packages/contracts/src/`.
2. **Build Contracts**: Run `pnpm --filter @repo/contracts build` (or rely on `pnpm dev` watch mode).
3. **Implement API Logic**:
   - Create NestJS DTOs using `createZodDto`.
   - Ensure all relative TypeScript imports in `apps/api` end in `.js`.
   - Organize files by feature module (e.g. `src/<feature>/<feature>.module.ts`).
4. **Implement Web Frontend**: Import shared DTO types/contracts from `@repo/contracts` into `apps/web`.
5. **Verification**:
   - Run `pnpm lint` to ensure zero oxlint warnings/errors.
   - Run `pnpm test` (or `pnpm --filter api exec vitest run ...`) to verify test suite health.
