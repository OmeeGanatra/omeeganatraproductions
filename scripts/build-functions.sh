#!/usr/bin/env bash
# Build Firebase Functions bundle from the pnpm monorepo.
# Run from repo root: ./scripts/build-functions.sh
set -euo pipefail

echo "→ Installing dependencies..."
pnpm install --frozen-lockfile

echo "→ Generating Prisma client..."
pnpm --filter @ogp/db generate

echo "→ Compiling @ogp/db..."
pnpm --filter @ogp/db build

echo "→ Bundling server with esbuild..."
mkdir -p functions
node_modules/.bin/esbuild apps/server/src/firebase.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outfile=functions/index.js \
  --external:@prisma/client \
  --external:bcryptjs \
  --external:sharp \
  --external:archiver \
  --external:bullmq \
  --external:ioredis \
  --external:firebase-admin \
  --external:firebase-functions

echo "→ Copying Prisma schema..."
mkdir -p functions/prisma
cp packages/db/prisma/schema.prisma functions/prisma/schema.prisma

echo "✓ Functions bundle ready at functions/index.js"
