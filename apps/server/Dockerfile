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

# Generate Prisma client into pnpm store
RUN pnpm --filter @ogp/db generate
# Compile @ogp/db so esbuild can import it
RUN pnpm --filter @ogp/db build

# Bundle entire server into one file — resolves all workspace deps,
# no node_modules or symlinks needed at runtime (except Prisma native binary)
RUN ./node_modules/.bin/esbuild apps/server/src/index.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=cjs \
      --outfile=/prod/server.js \
      --external:@prisma/client \
      --external:bcryptjs \
      --external:sharp \
      --external:archiver \
      --external:bullmq \
      --external:ioredis

# Copy only the native/C++ modules that can't be bundled.
# Use cp -rL to DEREFERENCE pnpm symlinks — gives us real files.
RUN mkdir -p /prod/node_modules
RUN cp -rL /app/node_modules/@prisma     /prod/node_modules/@prisma    2>/dev/null || true
RUN cp -rL /app/node_modules/.prisma     /prod/node_modules/.prisma    2>/dev/null || true
RUN cp -rL /app/node_modules/bcryptjs    /prod/node_modules/bcryptjs
RUN cp -rL /app/node_modules/archiver    /prod/node_modules/archiver
RUN cp -rL /app/node_modules/bullmq      /prod/node_modules/bullmq
RUN cp -rL /app/node_modules/ioredis     /prod/node_modules/ioredis

# Fallback: find @prisma in pnpm store if not hoisted
RUN if [ ! -d /prod/node_modules/@prisma ]; then \
      PDIR=$(find /app/node_modules/.pnpm -maxdepth 3 -name "@prisma" -type d | head -1); \
      [ -n "$PDIR" ] && cp -r "$PDIR" /prod/node_modules/; \
    fi
RUN if [ ! -d /prod/node_modules/.prisma ]; then \
      PDIR=$(find /app/node_modules/.pnpm -maxdepth 4 -name ".prisma" -type d | head -1); \
      [ -n "$PDIR" ] && cp -r "$PDIR" /prod/node_modules/; \
    fi

RUN cp -r /app/packages/db/prisma /prod/prisma

# ---- Stage 2: Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /prod ./

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
USER server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
