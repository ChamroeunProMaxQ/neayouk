# ==========================================
# Base Stage
# ==========================================
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat postgresql-client curl
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
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

# Initial build for shared contracts
RUN pnpm --filter @repo/contracts build

WORKDIR /app/apps/api
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "dev"]

# ==========================================
# Builder Stage (builds contracts and api)
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

ENV NODE_ENV=production
RUN pnpm --filter @repo/contracts build
RUN pnpm --filter api build

# Isolate production dependencies using pnpm deploy
RUN pnpm --filter api --prod --legacy deploy /prod/api

# ==========================================
# Production Runtime Stage
# ==========================================
FROM node:24-alpine AS prod
RUN apk add --no-cache libc6-compat postgresql-client curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy isolated production dependencies & configuration
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /prod/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/dist-db ./dist-db
COPY --from=builder /app/apps/api/database ./database
COPY --from=builder /app/packages/contracts/dist ./node_modules/@repo/contracts/dist
COPY --from=builder /app/packages/contracts/package.json ./node_modules/@repo/contracts/package.json

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

# Create uploads directory and set user permissions
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
