#!/bin/bash
set -e

echo "🔧 Generating Prisma Client (skipping migrations)..."
pnpm prisma generate

echo "🏗️ Building Next.js application..."
pnpm next build --no-lint

echo "✅ Build completed successfully!"




