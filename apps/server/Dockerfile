# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace manifests for install caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps/server/package.json apps/server/
COPY packages/db/package.json packages/db/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN pnpm install --frozen-lockfile

# Copy all source
COPY packages/db/ packages/db/
COPY packages/shared-types/ packages/shared-types/
COPY packages/typescript-config/ packages/typescript-config/
COPY apps/server/ apps/server/

# Generate Prisma client, build TypeScript
RUN pnpm --filter @ogp/db generate
RUN pnpm --filter @ogp/server build

# pnpm deploy creates a self-contained production bundle:
# resolves all workspace deps, removes devDeps, no broken symlinks
RUN pnpm --filter @ogp/server deploy --prod /prod

# Overlay the compiled output and Prisma schema into the deploy dir
RUN cp -r /app/apps/server/dist /prod/dist
RUN mkdir -p /prod/prisma && cp /app/packages/db/prisma/schema.prisma /prod/prisma/

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
WORKDIR /app

# Copy the self-contained bundle
COPY --from=builder /prod ./

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
USER server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
