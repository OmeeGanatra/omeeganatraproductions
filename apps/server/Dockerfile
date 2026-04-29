# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Copy package.json files for dependency resolution
COPY apps/server/package.json apps/server/
COPY packages/db/package.json packages/db/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/typescript-config/package.json packages/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db/ packages/db/
COPY packages/shared-types/ packages/shared-types/
COPY packages/typescript-config/ packages/typescript-config/
COPY apps/server/ apps/server/

# Generate Prisma client
RUN pnpm --filter @ogp/db generate

# Build the server
RUN pnpm --filter @ogp/server build

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
WORKDIR /app

# Copy built output
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./

# Copy node_modules (production deps already hoisted by pnpm)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules

# Copy Prisma schema and generated client (pnpm hoists to root node_modules)
COPY --from=builder /app/packages/db/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
USER server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
