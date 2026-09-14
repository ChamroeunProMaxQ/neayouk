# ==========================================
# Base Stage
# ==========================================
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat curl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11.11.0
WORKDIR /app

# ==========================================
# Dependencies Stage
# ==========================================
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ==========================================
# Development Stage (for docker-compose.dev.yml)
# ==========================================
FROM base AS dev
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

# Initial build for shared contracts
RUN pnpm --filter @repo/contracts build

WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# ==========================================
# Builder Stage (builds contracts and web bundle)
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

ENV NODE_ENV=production
RUN pnpm --filter @repo/contracts build
RUN pnpm --filter web build

# ==========================================
# Production Runtime Stage (Nginx Alpine)
# ==========================================
FROM nginx:alpine AS prod

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
