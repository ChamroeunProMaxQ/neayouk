# Web Frontend (`apps/web`)

Modern React 19 web application built with Vite 8, featuring Fast Refresh (HMR), TypeScript integration, dev server proxying, and shared type safety from `@repo/contracts`.

## 🚀 Features

- **React 19 & Vite 8**: Next-gen frontend stack with sub-second startup times and instant HMR.
- **Shared Validation & Types**: Imports DTO schemas, inferred types, enums, and route paths directly from `@repo/contracts`.
- **API Dev Proxy**: Vite dev server proxies all `/api` requests automatically to the NestJS API backend (`http://localhost:3000`).
- **High-Speed Linting**: Configured with `oxlint` for fast static analysis.

---

## 🛠️ Scripts & Usage

From the project root or inside `apps/web`:

| Command | Description |
| :--- | :--- |
| `pnpm dev:web` | Start Vite dev server at `http://localhost:5173` |
| `pnpm build` | Compile TypeScript and build production bundle (`tsc -b && vite build`) |
| `pnpm preview` | Preview production build output locally |
| `pnpm lint` | Lint frontend source code using `oxlint` |

---

## 🌐 API Proxy Configuration

The dev server in `vite.config.ts` proxies requests starting with `/api` to the backend:

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Web components can fetch relative endpoints (e.g. `fetch('/api/user')`) without hardcoding API hosts or dealing with CORS in development.
