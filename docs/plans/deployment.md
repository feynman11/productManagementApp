# Deployment & DevOps

## Overview

ProductPlan is deployed as a single TanStack Start application (no separate API server). The build produces both client and server bundles.

## Build

```bash
bun run build
# Produces: dist/client/ and dist/server/
```

The build step:
1. Vite bundles the client (React app, Tailwind CSS, assets)
2. Vite bundles the server (SSR renderer, server functions)
3. TypeScript type checking (`tsc --noEmit`)

## Production Server

TanStack Start uses `srvx` as the production server:

```bash
# Start production server
bun run dist/server/server.js
```

Or via the package.json script:

```bash
bun run preview
```

## Environment Variables

```env
# Database (production)
DATABASE_URL="postgresql://user:password@host:5432/productplan_prod"

# Clerk (production)
CLERK_SECRET_KEY="sk_live_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

# Server
PORT=3000
NODE_ENV=production

# Redis (optional, for caching)
REDIS_URL="redis://host:6379"
```

**Important:** `VITE_` prefixed variables are embedded into the client bundle at build time. All other variables are server-only.

## Database Migrations

```bash
# Deploy migrations (production -- no interactive prompts)
bunx prisma migrate deploy

# Generate client (must run after deploy)
bunx prisma generate
```

Never run `prisma migrate dev` in production.

## CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: productplan_test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx prisma generate
      - run: bunx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/productplan_test
      - run: bun run type-check
      - run: bun run lint
      - run: bun run test
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/productplan_test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx prisma generate
      - run: bun run build
      # Deploy to your hosting platform
```

## Hosting Options

### Option 1: Docker

```dockerfile
FROM oven/bun:1.3.10 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.3.10-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
EXPOSE 3000
CMD ["bun", "run", "dist/server/server.js"]
```

### Option 2: Railway / Fly.io / Render

These platforms support Bun and can run TanStack Start directly. Set build command to `bun run build` and start command to `bun run dist/server/server.js`.

### Option 3: Vercel / Netlify

TanStack Start has adapter support for serverless platforms. Check TanStack Start docs for the latest deployment adapters.

## Monitoring

- Application logs via the hosting platform
- Database monitoring via PostgreSQL metrics
- Clerk dashboard for auth analytics
- Playwright reports for regression tracking

## Security Checklist

- [ ] `CLERK_SECRET_KEY` is never exposed to the client
- [ ] Database URL uses SSL in production
- [ ] Webhook endpoints verify Svix signatures
- [ ] Super Admin credentials use strong passwords
- [ ] CORS is configured for production domain only
- [ ] All client data queries are scoped by `clientId`
- [ ] Rate limiting on auth endpoints
