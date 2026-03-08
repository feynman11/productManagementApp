# ──────────────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────────────
FROM oven/bun:1.3.10 AS build
WORKDIR /app

# Install dependencies first for better caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate
RUN bun run build

# ──────────────────────────────────────────────────────
# Stage 2: Production deps only
# ──────────────────────────────────────────────────────
FROM oven/bun:1.3.10-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ──────────────────────────────────────────────────────
# Stage 3: Production
# ──────────────────────────────────────────────────────
FROM oven/bun:1.3.10-slim
WORKDIR /app

# Copy production deps (smaller than full node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy built output and production server
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.ts .
COPY --from=build /app/package.json .
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts .
COPY --from=build /app/src/generated ./src/generated

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "serve.ts"]
