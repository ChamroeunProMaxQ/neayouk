# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

pnpm-workspace + Turborepo monorepo template. Package manager is pnpm (^11.3, auto-downloaded via `devEngines`). All packages are ESM (`"type": "module"`).

- `apps/api` — NestJS 12 (alpha) REST API, port 3000
- `apps/web` — React 19 + Vite 8 frontend, port 5173
- `packages/shared` (`@repo/shared`) — Zod schemas and DTO classes used by both apps
- `packages/types` (`@repo/types`) — type-only package, consumed straight from `src/` (no build); currently empty and unused by the apps

## Commands

Run from the repo root; they fan out via Turborepo:

```sh
pnpm install
pnpm dev        # all dev tasks: api watch, web dev server, shared tsc --watch
pnpm dev:api    # api only (nest start --watch)
pnpm dev:web    # web only (vite)
pnpm build      # turbo build with dependency ordering (^build)
pnpm lint       # oxlint in each workspace
pnpm test       # api Vitest e2e tests (web has no test script)
```

Single test file (note: bare `vitest` is watch mode; use `run` for a one-shot):

```sh
pnpm --filter api exec vitest run test/app.e2e-spec.ts
pnpm --filter api exec vitest run -t "test name"
```

Manual API testing: `apps/api/http/user.http` (REST Client file).

## Architecture

### Shared Zod schemas → API DTOs → response envelope

The core pattern spans `packages/shared` and `apps/api`:

1. Zod schemas and their inferred types live in `packages/shared/src/*.dto.ts` (e.g. `CreateUserSchema`), so web and api validate against the same source of truth.
2. API DTO classes are one-liners: `class CreateUserDto extends createZodDto(CreateUserSchema)` (see `apps/api/src/user/create-user.dto.ts`).
3. `apps/api/src/app.module.ts` registers global providers: `ZodValidationPipe` (validates all `@Body`/`@Query` DTOs automatically — no per-route pipes needed), `ZodSerializerInterceptor`, `ResponseInterceptor`, and `HttpExceptionsFilter`.
4. `ResponseInterceptor` (`apps/api/src/common/interceptor/response.interceptor.ts`) wraps every JSON response in the `ResponseDto` envelope from `@repo/shared`: `{ status, message, data, pagination? }`. Controllers return raw data; returning `{ count, rows }` when the request has `?page&pageSize` query params produces pagination metadata automatically.
5. The envelope `message` defaults to `"success"`; set it per-route/controller with the `@HttpMessage('...')` decorator (`apps/api/src/common/decorator/message.decorator.ts`).
6. `HttpExceptionsFilter` normalizes all errors — including Zod validation failures — into the same `ResponseDto` envelope, so clients always get one response shape.

### Dev-time wiring

API listens on 3000 with CORS allowing `http://localhost:5173`; the Vite dev server proxies `/api` → `http://localhost:3000`, so web code calls relative `/api/...` paths. Route constants live in `packages/shared/src/route.ts` (not re-exported from the package index).

## Gotchas

- **`.js` extensions in api imports**: the api uses NodeNext module resolution, so relative imports must include the `.js` extension (`import { AppModule } from './app.module.js'`) even in `.ts` files.
- **`@repo/shared` resolves to `dist/`**: its package exports point at build output, so it must be compiled before the apps can import it. Root `pnpm dev` runs its `tsc --watch`; `pnpm build` orders it via turbo's `^build`. If imports from `@repo/shared` fail to resolve, build the package. `@repo/types` by contrast is consumed directly from `src/` with no build step.
- **Lint is oxlint, not ESLint**: `apps/api/eslint.config.mjs` and the ESLint devDependencies are leftovers not used by the `lint` scripts.
- **Jest remnants are dead**: the `jest` config block and `test:debug`/`test:e2e` scripts in `apps/api/package.json` reference missing files; the working test runner is Vitest (`apps/api/vitest.config.ts`, which only picks up `test/**/*.e2e-spec.ts` — `src/**/*.spec.ts` files are not run).
