# 🚀 d1-monorepo-template

Production-grade full-stack TypeScript monorepo template built with **pnpm**, **Turborepo**, **NestJS 12**, **React 19**, **Vite 8**, **Zod**, and an integrated **Observability & Infrastructure Stack** (Grafana, Loki, Prometheus, Tempo).

---

## 📑 Table of Contents

- [Features](#-features)
- [Monorepo Architecture](#-monorepo-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Key Architectural Patterns](#-key-architectural-patterns)
  - [End-to-End Validation & Shared DTOs](#1-end-to-end-validation--shared-dtos)
  - [Unified Response Envelope](#2-unified-response-envelope)
  - [Node ESM Resolution Rules](#3-node-esm-resolution-rules)
  - [Dev Server Proxying](#4-dev-server-proxying)
- [Observability & Infrastructure Stack](#-observability--infrastructure-stack)
- [Testing & Quality Control](#-testing--quality-control)

---

## ✨ Features

- ⚡ **Turborepo & pnpm Workspaces**: Lightning-fast incremental builds and cached task execution.
- 🛡️ **NestJS 12 API (`apps/api`)**: Node.js ESM REST API with TypeORM + MySQL, Passport JWT auth, CASL access control, and NestLens devtools.
- 🎨 **React 19 + Vite 8 Web (`apps/web`)**: Modern, high-performance SPA frontend configured with Vite dev proxy.
- 📐 **Single Source of Truth (`packages/shared`)**: Shared Zod schemas converted to NestJS DTOs via `nestjs-zod`.
- 📊 **Complete Observability (`infra/log-explorer`)**: Pre-configured Docker Compose stack with Grafana dashboard, Loki log aggregation, OpenTelemetry traces via Tempo, and Prometheus metrics.
- 🚀 **Modern Tooling**: `oxlint` for high-speed linting and `vitest` for fast e2e testing.

---

## 🏛️ Monorepo Architecture

```
d1-monorepo-template/
├── apps/
│   ├── api/                 # NestJS 12 REST API (Port 3000)
│   └── web/                 # React 19 + Vite 8 SPA (Port 5173)
├── packages/
│   └── contracts/           # Shared Zod schemas, DTO types, Enums, & Route constants (@repo/contracts)
└── infra/
    └── log-explorer/        # Docker Compose Observability Stack (Grafana, Loki, Prometheus, Tempo)
```

### Workspace Packages Summary

| Workspace | Package Name | Description | Build Step |
| :--- | :--- | :--- | :--- |
| `apps/api` | `api` | NestJS 12 server with TypeORM, Zod validation, CASL & OTel | `nest build` |
| `apps/web` | `web` | React 19 + Vite 8 Web Application | `tsc -b && vite build` |
| `packages/contracts` | `@repo/contracts` | Zod validation schemas, inferred DTO types, Enums & Routes | Direct TS / `tsc` |

---

## 💻 Tech Stack

- **Monorepo Manager**: Turborepo, pnpm (`v11.3+`)
- **Backend Framework**: NestJS 12 (alpha), Node.js ESM (`"type": "module"`)
- **Frontend Framework**: React 19, Vite 8
- **Database & ORM**: MySQL, TypeORM, Umzug (Migrations/Seeders)
- **Validation**: Zod, `nestjs-zod`
- **Auth & Authorization**: Passport JWT, CASL (`@casl/ability`, `nest-casl`)
- **Observability**: OpenTelemetry, Prometheus, Winston + Loki, Grafana, NestLens
- **Linting & Testing**: Oxlint, Vitest

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20+` (or `v24+` recommended)
- **pnpm**: `v11.3+` (managed via `devEngines` auto-download)
- **Docker & Docker Compose**: Required for MySQL & Observability stack

### 1. Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

### 2. Environment Setup

Create `.env` file in `apps/api` (or workspace root as needed) to set up database connection strings, JWT secrets, and observability configs.

### 3. Database Migrations & Seeders

Build shared dependencies first, then execute migrations:

```bash
# Build contracts package
pnpm --filter @repo/contracts build

# Run migrations
pnpm --filter api migrate

# Run database seeders
pnpm --filter api seed
```

### 4. Running Development Servers

Start all applications and packages concurrently with live reload:

```bash
pnpm dev
```

Or run individual apps:

```bash
pnpm dev:api    # Start API NestJS server (watch mode)
pnpm dev:web    # Start Web Vite dev server (http://localhost:5173)
```

---

## 📜 Available Scripts

Run commands from the repository root:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run all applications and watch for file changes |
| `pnpm dev:api` | Run only the NestJS API application in dev mode |
| `pnpm dev:web` | Run only the React frontend application in dev mode |
| `pnpm build` | Build all workspace packages in dependency order (`^build`) |
| `pnpm lint` | Run `oxlint` across all workspaces |
| `pnpm test` | Run API e2e spec tests via Vitest |

---

## 🔑 Key Architectural Patterns

### 1. End-to-End Validation & Shared DTOs
1. Zod schemas and inferred types are defined in `packages/contracts/src/*.dto.ts` (e.g. `CreateUserSchema`).
2. API DTO classes extend `createZodDto`:
   ```ts
   import { createZodDto } from 'nestjs-zod';
   import { CreateUserSchema } from '@repo/contracts';

   export class CreateUserDto extends createZodDto(CreateUserSchema) {}
   ```
3. `ZodValidationPipe` automatically validates incoming requests on `@Body()` and `@Query()`.

### 2. Unified Response Envelope
`ResponseInterceptor` and `HttpExceptionsFilter` ensure every API response adheres to the standardized `ResponseDto` structure:

```json
{
  "status": 200,
  "message": "success",
  "data": { ... },
  "pagination": { ... }
}
```

- Custom messages can be defined per controller/route via the `@HttpMessage('...')` decorator.

### 3. Node ESM Resolution Rules
The NestJS API uses `NodeNext` ESM module resolution. **All relative imports inside `apps/api/src/**/*.ts` must end with `.js` extensions**:
```ts
import { AppModule } from './app.module.js';
```

### 4. Dev Server Proxying
The web app (`apps/web`) communicates with the API server (`http://localhost:3000`) via Vite's proxy rules (`/api` → `http://localhost:3000`).

---

## 📊 Observability & Infrastructure Stack

The repository includes a ready-to-run observability stack inside `infra/log-explorer/`:

```bash
cd infra/log-explorer
docker-compose up -d
```

### Services & Port Mappings

- **Grafana**: `http://localhost:13000` (User: `admin` / Password: `admin`)
- **Prometheus**: `http://localhost:9090`
- **Loki**: `http://localhost:3100`
- **Tempo**: `http://localhost:3200` (OTLP HTTP: `4318`, OTLP gRPC: `4317`)

---

## 🧪 Testing & Quality Control

### Running Tests

```bash
# Workspace test fan-out
pnpm test

# Run specific Vitest test file in API
pnpm --filter api exec vitest run test/app.e2e-spec.ts

# Filter tests by title
pnpm --filter api exec vitest run -t "user controller"
```

### Manual API Requests

API endpoints can be tested manually using the REST Client file:
- [`apps/api/http/user.http`](file:///e:/work/d1-monorepo-template/apps/api/http/user.http)

---

## 📄 License

This project is open-source under the ISC License.
