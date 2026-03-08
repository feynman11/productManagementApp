# Development Guide

## Prerequisites

- **Bun** v1.3.10+ ([install](https://bun.sh))
- **PostgreSQL** 16+ (running locally or via Docker)
- **Clerk** account with a publishable key and secret key
- **Node.js** 20.19+ (required by Prisma 7, even when using Bun)

## Getting Started

### 1. Clone the Starter Repo

```bash
# Clone from TanStack Start + Clerk example
git clone https://github.com/TanStack/router.git --depth 1 --sparse
cd router
git sparse-checkout set examples/react/start-clerk-basic
cp -r examples/react/start-clerk-basic ../productplan
cd ../productplan
```

Or start fresh:

```bash
bun create @tanstack/start@latest productplan
cd productplan
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Variables

Create `.env` from the example:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/productplan_dev"

# Clerk
CLERK_SECRET_KEY="sk_test_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

# Super Admin JWT auth
SUPER_ADMIN_JWT_SECRET="dev-secret-change-in-production"

# OpenAI (optional — enables AI features)
OPENAI_API_KEY="sk-..."
```

### 4. Database Setup

```bash
# Generate Prisma client and Zod schemas
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed development data
bun run prisma/seed.ts
```

### 5. Start Development Server

```bash
bun run dev
```

This starts the TanStack Start dev server on `http://localhost:3000` with HMR.

### 6. Shadcn UI Setup

Shadcn components are already installed in `src/components/ui/`. To add more:

```bash
bunx shadcn@latest add [component-name]
```

Installed components: alert-dialog, avatar, badge, button, card, dialog, dropdown-menu, form, input, label, popover, scroll-area, select, separator, sheet, sonner, table, tabs, tooltip.

### 7. Docker Alternative

Instead of steps 3-5, you can use Docker Compose:

```bash
docker compose up -d    # Starts PostgreSQL + app
```

## Project Scripts

```json
{
  "dev": "vite dev",
  "build": "vite build && tsc --noEmit",
  "preview": "vite preview",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "bun run prisma/seed.ts",
  "prisma:studio": "prisma studio",
  "test": "vitest",
  "test:e2e": "playwright test",
  "lint": "eslint . --ext ts,tsx",
  "format": "prettier --write \"**/*.{ts,tsx,json,css,md}\"",
  "type-check": "tsc --noEmit"
}
```

## Development Workflow

### Adding a New Feature

1. Update `prisma/schema.prisma` with new/changed models
2. Run `bunx prisma migrate dev --name describe-change`
3. This auto-runs `prisma generate`, updating both Prisma types and Zod schemas
4. Create server functions in `src/server/functions/`
5. Create route files in `src/routes/`
6. Build UI components using Shadcn + generated Zod schemas for forms
7. Write E2E tests in `tests/e2e/`

### Adding a Shadcn Component

```bash
bunx shadcn@latest add [component-name]
```

Components are installed to `src/components/ui/`.

### Database Changes

```bash
# Create migration
bunx prisma migrate dev --name add-new-field

# View database
bunx prisma studio

# Reset database (destructive)
bunx prisma migrate reset
```

### Type Safety Flow

```
schema.prisma → prisma generate → generated/prisma/ (types)
                                → generated/zod/    (validation)
```

After any schema change, run `prisma generate` to update types and Zod schemas.

## File Organization

### Server Functions

One file per domain in `src/server/functions/`:

```typescript
// src/server/functions/products.ts
import { createServerFn } from '@tanstack/react-start'
import { ProductCreateInputSchema } from '~/generated/zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'

export const createProduct = createServerFn({ method: 'POST' })
  .validator(ProductCreateInputSchema)
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    return prisma.product.create({
      data: { ...data, clientId },
    })
  })
```

Server function files: `products.ts`, `ideas.ts`, `roadmap.ts`, `issues.ts`, `clients.ts`, `auth.ts`, `notifications.ts`, `ai.ts`, `export.ts`, `export-pdf.ts`.

**Important:** Use `.inputValidator()` (not `.validator()`) for input validation in TanStack Start server functions. Call server functions with `{ data: { ... } }` wrapping from clients.

### Routes

Follow TanStack Router file-based routing conventions:

- `__root.tsx` -- Root layout (HTML shell, ClerkProvider)
- `_authed.tsx` -- Auth guard (pathless layout)
- `$orgSlug.tsx` -- Client org layout (pathless with param)
- `products.tsx` -- Products list
- `products.$productId.tsx` -- Product detail

### Components

```
src/components/
  ui/           # Shadcn (auto-generated, don't edit heavily)
  layouts/      # App layouts (sidebar, header)
  common/       # Shared components (loading, error boundaries)
  products/     # Product-specific components
  ideas/        # Ideas-specific components
  ...
```

## Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Organizations in Clerk dashboard
3. Configure organization roles: `org:admin`, `org:member`, and a custom `org:viewer`
4. Set up webhook endpoint in Clerk dashboard pointing to your dev URL + `/api/webhooks/clerk`
5. Copy the webhook signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`

## Troubleshooting

### `auth()` returns null during SSR

Ensure `ssr.noExternal: ['@clerk/tanstack-react-start']` is set in `vite.config.ts`.

### Prisma client not found

Run `bunx prisma generate` -- Prisma 7 outputs to `src/generated/prisma/`, not `node_modules`.

### Zod schema out of date

Run `bunx prisma generate` after any schema change to regenerate both Prisma types and Zod schemas.

### Tailwind classes not working

Ensure `@import "tailwindcss"` is at the top of your CSS file and `@tailwindcss/vite` is in `vite.config.ts` plugins.
