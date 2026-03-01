# ProductPlan

Multi-tenant SaaS product management application built with TanStack Start, React 19, Prisma 7, and Clerk.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.3.10+ |
| Framework | TanStack Start (full-stack SSR) |
| Language | TypeScript 5.7 (strict) |
| UI | React 19, Tailwind CSS v4, Shadcn UI |
| Auth | Clerk (`@clerk/tanstack-react-start`) |
| Database | PostgreSQL 16+, Prisma 7 |
| Validation | Zod (auto-generated from Prisma) |
| Testing | Playwright (E2E), Vitest (unit) |

## Prerequisites

- [Bun](https://bun.sh) v1.3.10+
- [Node.js](https://nodejs.org) 20.19+ (required by Prisma 7)
- [PostgreSQL](https://www.postgresql.org) 16+ (local or Docker)
- A [Clerk](https://clerk.com) account

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database — point to your local PostgreSQL instance
DATABASE_URL="postgresql://user:password@localhost:5432/productplan_dev"

# Clerk — get these from https://dashboard.clerk.com
CLERK_SECRET_KEY="sk_test_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

# Super Admin credentials (dev only)
SUPER_ADMIN_EMAIL="superadmin@productplan.com"
SUPER_ADMIN_PASSWORD="change-me-in-production"
```

### 3. Create the database

```bash
createdb productplan_dev
```

Or with Docker:

```bash
docker run -d --name productplan-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=productplan_dev \
  -p 5432:5432 \
  postgres:16
```

### 4. Generate Prisma client and run migrations

```bash
bunx prisma generate       # Generates TypeScript types + Zod schemas
bunx prisma migrate dev    # Creates tables
```

### 5. Seed development data

```bash
bun run prisma/seed.ts
```

This creates sample Super Admin, 2 clients (Acme Corp, TechStart Inc), products, ideas, roadmap items, issues, and more.

### 6. Configure Clerk

1. Create an application at [clerk.com](https://clerk.com)
2. Enable **Organizations** in the Clerk dashboard
3. Configure organization roles: `org:admin`, `org:member`, and a custom `org:viewer`
4. Set up a webhook endpoint pointing to `http://localhost:3000/api/webhooks/clerk`
5. Subscribe to: `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
6. Copy the webhook signing secret to `CLERK_WEBHOOK_SIGNING_SECRET` in `.env`

### 7. Start the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with HMR (port 3000) |
| `bun run build` | Production build + type check |
| `bun run preview` | Preview production build |
| `bunx prisma generate` | Regenerate Prisma types + Zod schemas |
| `bunx prisma migrate dev` | Create/apply database migrations |
| `bunx prisma studio` | Open database GUI |
| `bun run prisma:seed` | Seed development data |
| `bun run test` | Run unit tests (Vitest) |
| `bun run test:e2e` | Run E2E tests (Playwright) |
| `bun run type-check` | TypeScript type checking |

## Project Structure

```
src/
  routes/                  # TanStack Router file-based routes
    __root.tsx             # Root layout (ClerkProvider, theme)
    _authed.tsx            # Auth guard (redirects to sign-in)
    _authed/$orgSlug/      # Client-scoped pages (dashboard, products, etc.)
    _authed/super-admin/   # Super Admin portal
    api/webhooks/clerk.ts  # Clerk webhook endpoint
  server/functions/        # Server functions (business logic)
    products.ts            # Product CRUD
    ideas.ts               # Ideas, voting, RICE scoring, promotion
    roadmap.ts             # Roadmaps, items, releases
    issues.ts              # Issue tracking, assignment
    clients.ts             # Super Admin client management
    auth.ts                # Authentication functions
  server/webhooks/         # Webhook processing logic
  components/
    ui/                    # Shadcn UI components
    layouts/               # App layout, sidebar
    common/                # Shared components (badges, comments)
    ideas/                 # Ideas-specific (RICE card, vote button)
  lib/
    prisma.ts              # Prisma client singleton
    auth.server.ts         # Server-side auth helpers
    permissions.ts         # RBAC role checking
    utils.ts               # cn() utility
  styles/app.css           # Tailwind v4 theme (OKLCH, dark mode)
prisma/
  schema.prisma            # Database schema (single source of truth)
  seed.ts                  # Development seed data
tests/
  e2e/                     # Playwright E2E tests
  unit/                    # Vitest unit tests
```

## Development Workflow

### Adding a new feature

1. Update `prisma/schema.prisma` if new models/fields are needed
2. Run `bunx prisma migrate dev --name describe-change`
3. Create server functions in `src/server/functions/`
4. Create route files in `src/routes/`
5. Build UI components
6. Write tests

### Adding a Shadcn component

```bash
bunx shadcn@latest add [component-name]
```

### After any schema change

```bash
bunx prisma generate    # Regenerates both TypeScript types and Zod schemas
```

## Architecture Notes

- **No separate backend** — all server logic runs through TanStack Start server functions (`createServerFn`). No Express or Fastify.
- **Multi-tenancy** — every business query is scoped by `clientId`. Server functions call `requireClientAuth()` which extracts the client from the Clerk organization context.
- **Tailwind v4 CSS-first** — no `tailwind.config.ts`. All theming in `src/styles/app.css` via `@theme inline`.
- **Prisma 7** — uses driver adapter (`@prisma/adapter-pg`), explicit output directory, and `prisma.config.ts`.
- **Type safety** — Prisma schema generates both TypeScript types and Zod validation schemas. Never write these by hand.

## Super Admin Setup

The Super Admin portal (`/super-admin/login`) uses email + password auth, separate from Clerk. To create a super admin user:

### Option A: Via Prisma Studio

```bash
bunx prisma studio
```

Open the `SuperAdmin` table and add a row. Generate an argon2 hash for the password:

```bash
bun -e "import { hash } from 'argon2'; hash('your-password').then(console.log)"
```

### Option B: Via SQL

```sql
INSERT INTO "SuperAdmin" (id, email, "passwordHash", name, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  -- Replace with a real argon2 hash (see above)
  '$argon2id$v=19$m=65536,t=3,p=4$your_hash_here',
  'Admin',
  NOW(),
  NOW()
);
```

### Option C: Via seed script

The seed script (`bun run prisma:seed`) creates a placeholder super admin. Update `prisma/seed.ts` with a real argon2 hash before running in non-dev environments.

## Documentation

Detailed plans and specifications live in `docs/plans/`. See [CLAUDE.md](./CLAUDE.md) for the full list.
