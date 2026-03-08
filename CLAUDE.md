# ProductPlan

Multi-tenant SaaS product management application.

## Documentation

All technical plans and specifications live in `docs/plans/`. Read the relevant doc before working on any area:

- `docs/plans/architecture.md` — System design, project structure, execution model
- `docs/plans/database-schema.md` — Prisma 7 schema, type safety strategy (Prisma → Zod)
- `docs/plans/auth-clerk.md` — Clerk integration, route protection, roles, webhooks
- `docs/plans/saas-multi-tenancy.md` — Tenant isolation, Clerk Organizations, data scoping
- `docs/plans/ui-ux-tailwind-shadcn.md` — Tailwind v4, Shadcn UI, dark mode, theming
- `docs/plans/api-specification.md` — Server function inventory and auth requirements
- `docs/plans/products-module.md` — Products CRUD, permissions
- `docs/plans/ideas-module.md` — Ideas, RICE scoring, voting, promotion
- `docs/plans/roadmap-module.md` — Roadmap views, releases, dependencies
- `docs/plans/issues-module.md` — Issue tracking, severity, assignments
- `docs/plans/testing-strategy.md` — Playwright E2E, Vitest unit tests
- `docs/plans/development-guide.md` — Local setup, workflow, scripts
- `docs/plans/deployment.md` — Build, CI/CD, Docker, hosting

## Tech Stack

- **Framework**: TanStack Start (full-stack SSR, no separate backend server)
- **Runtime**: Bun 1.3.10+
- **Language**: TypeScript 5.7.3 (strict mode)
- **UI**: React 19, Tailwind CSS v4 (`@tailwindcss/vite`), Shadcn UI (new-york style)
- **Auth**: Clerk via `@clerk/tanstack-react-start`
- **Database**: PostgreSQL 16+, Prisma 7
- **Validation**: Zod (auto-generated from Prisma via `prisma-zod-generator`)
- **Testing**: Playwright (E2E), Vitest (unit)

## Architecture Rules

### No Separate Backend
All server logic uses TanStack Start server functions (`createServerFn`). No Express, Fastify, or standalone API server.

### Single Source of Truth for Types
`prisma/schema.prisma` defines all data models. Run `bunx prisma generate` to produce both Prisma TS types (`src/generated/prisma/`) and Zod validation schemas (`src/generated/zod/`). Never write types or Zod schemas by hand for database models.

### Multi-Tenancy
Every business model has a `clientId` field. Every server function that reads/writes business data must call `requireClientAuth()` and scope queries by `clientId`. Never query business data without a `clientId` WHERE clause.

### Auth Pattern
- Clerk is used for login/session only (NOT for organization management)
- Clerk middleware runs on every request via `src/start.ts`
- Server functions use `auth()` from `@clerk/tanstack-react-start/server` for `userId` only
- Protected routes use `_authed.tsx` pathless layout with `beforeLoad` guard
- Organizations are native (app-managed), not Clerk Organizations
- `AppUser` model tracks each Clerk user in the DB; first user becomes super admin
- `AppUser.activeClientId` tracks the user's current org selection
- Demo org (`Client.isDemo = true`) allows all authenticated users read-only access
- Org roles: `ADMIN`, `CONTRIBUTOR`, `VIEWER` (stored on `ClientUser`)
- Super admins: `AppUser.isSuperAdmin = true`, authenticated via Clerk (no separate login)
- `requireClientAuth({ slug? })` resolves org from URL slug or `activeClientId`
- `requireSuperAdmin()` checks `AppUser.isSuperAdmin` (Clerk-authenticated)
- `canWrite(role, isDemo)` and `canAdmin(role, isDemo)` enforce permissions

### Tailwind v4 (CSS-First)
No `tailwind.config.ts` or `postcss.config.js`. All theming via `@theme inline` in `src/styles/app.css`. Colors use OKLCH format. Animations use `tw-animate-css` (not `tailwindcss-animate`).

### Prisma 7
- Generator provider is `"prisma-client"` (not `"prisma-client-js"`)
- Requires explicit `output` directive in generator block
- Requires `prisma.config.ts` at project root
- Requires driver adapter (`@prisma/adapter-pg`)
- ESM-only (`"type": "module"` in package.json)

## Commands

```bash
bun run dev              # Start dev server (localhost:3000)
bun run build            # Production build
bunx prisma generate     # Regenerate Prisma types + Zod schemas
bunx prisma migrate dev  # Create/apply migrations
bunx prisma studio       # Database GUI
bun run prisma/seed.ts   # Seed development data
bun run test             # Vitest unit tests
bun run test:e2e         # Playwright E2E tests
bunx shadcn@latest add   # Add Shadcn component
docker compose up -d     # Start app + PostgreSQL via Docker
docker build .           # Build production Docker image
```

## Starter Repo

Based on: https://github.com/TanStack/router/tree/main/examples/react/start-clerk-basic

## Vite Config Note

Must include `ssr: { noExternal: ['@clerk/tanstack-react-start'] }` for Clerk auth to work during SSR.
