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

# Super Admin JWT auth
SUPER_ADMIN_JWT_SECRET="generate-a-random-256-bit-secret"

# OpenAI (optional — enables AI features)
OPENAI_API_KEY="sk-..."

# Server
PORT=3000
NODE_ENV=production
```

**Important:**
- `VITE_` prefixed variables are embedded into the client bundle at build time. All other variables are server-only.
- `SUPER_ADMIN_JWT_SECRET` and `OPENAI_API_KEY` must NOT have a `VITE_` prefix — they are server-only secrets.

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

### Option 1: Docker (Implemented)

The project includes a production-ready `Dockerfile` and `docker-compose.yml`.

#### Dockerfile (multi-stage build)

```dockerfile
# Stage 1: Build
FROM oven/bun:1.3.10 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build

# Stage 2: Production
FROM oven/bun:1.3.10-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts .
COPY --from=build /app/src/generated ./src/generated
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "run", "dist/server/server.js"]
```

#### docker-compose.yml (local development)

```bash
docker compose up -d
```

Starts PostgreSQL 16 on port 5432 and the app on port 3000. The database is health-checked before the app starts.

#### .dockerignore

Excludes `node_modules`, `tests`, `docs`, `.git`, `.env`, and other development-only files from the build context.

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
- [ ] `SUPER_ADMIN_JWT_SECRET` is a strong random secret (not the dev default)
- [ ] `OPENAI_API_KEY` has no `VITE_` prefix (server-only)
- [ ] `sa_token` cookie is httpOnly, Secure, SameSite=Strict
- [ ] Database URL uses SSL in production
- [ ] Webhook endpoints verify Svix signatures
- [ ] Super Admin passwords use argon2 hashing
- [ ] CORS is configured for production domain only
- [ ] All client data queries are scoped by `clientId`
- [ ] All notification/AI/export functions scope by `clientId`
- [ ] All super admin functions call `requireSuperAdmin()`
- [ ] No `dangerouslySetInnerHTML` for AI-generated content
- [ ] No raw SQL (`$queryRaw`) usage
- [ ] Rate limiting on auth endpoints
