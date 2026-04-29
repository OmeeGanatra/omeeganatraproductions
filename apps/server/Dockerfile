# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps/server/package.json apps/server/
COPY packages/db/package.json packages/db/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN pnpm install --frozen-lockfile

COPY packages/db/ packages/db/
COPY packages/shared-types/ packages/shared-types/
COPY packages/typescript-config/ packages/typescript-config/
COPY apps/server/ apps/server/

# Generate Prisma client (goes into pnpm store inside node_modules)
RUN pnpm --filter @ogp/db generate
# Compile @ogp/db to dist/
RUN pnpm --filter @ogp/db build
# Compile server to dist/
RUN pnpm --filter @ogp/server build

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
WORKDIR /app

# Server compiled output
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json

# The full node_modules tree — pnpm store (.pnpm/) contains the
# generated Prisma query engine; symlinks inside node_modules resolve
# correctly because we preserve the same relative paths.
COPY --from=builder /app/node_modules ./node_modules

# Workspace packages that node_modules symlinks point into
COPY --from=builder /app/packages/db/dist         ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/shared-types    ./packages/shared-types

# Prisma schema (used by migrate:deploy at deploy time, not at runtime)
COPY --from=builder /app/packages/db/prisma ./prisma

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
USER server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
