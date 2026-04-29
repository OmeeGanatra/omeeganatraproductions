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

RUN pnpm --filter @ogp/db generate
RUN pnpm --filter @ogp/db build
RUN pnpm --filter @ogp/server build

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
WORKDIR /app

# Preserve the exact monorepo layout so every pnpm symlink resolves:
#   /app/node_modules/.pnpm/...  ← shared store (Prisma engine lives here)
#   /app/apps/server/node_modules/express → symlink into .pnpm
#   /app/node_modules/@ogp/db    → symlink to /app/packages/db
COPY --from=builder /app/node_modules              ./node_modules
COPY --from=builder /app/apps/server/node_modules  ./apps/server/node_modules
COPY --from=builder /app/apps/server/dist          ./apps/server/dist
COPY --from=builder /app/apps/server/package.json  ./apps/server/package.json
COPY --from=builder /app/packages/db/dist          ./packages/db/dist
COPY --from=builder /app/packages/db/package.json  ./packages/db/package.json
COPY --from=builder /app/packages/shared-types     ./packages/shared-types
COPY --from=builder /app/packages/db/prisma        ./prisma

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
USER server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/server/dist/index.js"]
