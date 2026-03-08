# Architecture Overview

## System Design

ProductPlan is a full-stack SaaS application built on **TanStack Start** -- a React-based SSR framework that unifies frontend and backend into a single deployment. There is no separate API server; all server-side logic runs via TanStack Start server functions.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Bun | 1.3.10+ |
| Framework | TanStack Start (React) | 1.164+ |
| Language | TypeScript | 5.7.3+ |
| Routing | TanStack Router (file-based) | 1.163+ |
| Data Fetching | TanStack Query | 5.90+ |
| Forms | TanStack Form | 0.41+ |
| Auth | Clerk (`@clerk/tanstack-react-start`) | 0.27+ |
| ORM | Prisma | 7.4+ |
| Database | PostgreSQL | 16+ |
| Styling | Tailwind CSS 4 + Shadcn UI | 4.1+ |
| Validation | Zod (auto-generated from Prisma) | 3.24+ |
| Testing | Playwright (E2E), Vitest (unit) | latest |

## Execution Model

TanStack Start applications run in two environments:

1. **Server (Node/Bun)** -- Has access to the file system, database (Prisma), environment variables, and Clerk server-side auth.
2. **Browser** -- Runs the hydrated React application after SSR.

### Request Lifecycle

```
Browser Request
  → TanStack Start Server (Bun)
    → Clerk Middleware (authenticate request)
    → Route Matching (file-based routing)
    → Route `beforeLoad` (server functions for auth checks)
    → Route `loader` (server functions for data fetching via Prisma)
    → SSR Render (React components)
    → Stream HTML to browser
  → Client Hydration
    → Client-side navigation (SPA mode after initial load)
```

### Server Functions

Server functions (`createServerFn`) are the primary mechanism for server-side logic. They:

- Run exclusively on the server
- Are addressed by a generated, stable function ID
- Support input validation via `.validator()` with Zod schemas
- Are type-safe end-to-end (input and output types flow to the caller)

```typescript
// Example: Fetch products for the current client
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireAuth } from '~/lib/auth.server'

export const getProducts = createServerFn({ method: 'GET' })
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const auth = await requireAuth()
    return prisma.product.findMany({
      where: { clientId: data.clientId },
    })
  })
```

## Project Structure

```
productplan/
├── prisma/
│   ├── schema.prisma              # Single source of truth for data types
│   ├── migrations/
│   └── seed.ts
├── prisma.config.ts               # Prisma 7 config (datasource, migrations)
├── src/
│   ├── start.ts                   # TanStack Start entry (Clerk middleware)
│   ├── router.tsx                 # Router creation
│   ├── routeTree.gen.ts           # Auto-generated route tree
│   ├── routes/
│   │   ├── __root.tsx             # Root layout (ClerkProvider, HTML shell)
│   │   ├── index.tsx              # Landing / redirect
│   │   ├── _authed.tsx            # Auth guard layout (pathless)
│   │   ├── _authed/
│   │   │   │   ├── super-admin.tsx     # Super admin layout guard (JWT session check)
│   │   │   ├── super-admin/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── clients.tsx
│   │   │   │   └── clients.$clientId.tsx
│   │   │   ├── $orgSlug.tsx       # Client org layout (pathless w/ param)
│   │   │   └── $orgSlug/
│   │   │       ├── index.tsx      # Client dashboard
│   │   │       ├── products.tsx
│   │   │       ├── products.$productId.tsx
│   │   │       ├── ideas.tsx
│   │   │       ├── roadmap.tsx
│   │   │       ├── issues.tsx
│   │   │       └── settings.tsx
│   ├── components/
│   │   ├── ui/                    # Shadcn UI (copied in)
│   │   ├── layouts/
│   │   └── common/
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.server.ts         # Server-side auth helpers (Clerk + Super Admin JWT)
│   │   ├── jwt.server.ts          # Super Admin JWT creation/verification (jose)
│   │   ├── openai.ts              # OpenAI client singleton
│   │   ├── notifications.server.ts # Notification creation helpers
│   │   ├── download.ts            # Client-side file download helpers
│   │   ├── utils.ts               # cn() utility
│   │   └── permissions.ts         # RBAC helpers
│   ├── server/
│   │   ├── functions/             # Server functions organized by domain
│   │   │   ├── products.ts
│   │   │   ├── ideas.ts
│   │   │   ├── roadmap.ts
│   │   │   ├── issues.ts
│   │   │   ├── clients.ts        # Super admin client management
│   │   │   ├── auth.ts           # Auth functions (Clerk, super admin login/logout)
│   │   │   ├── notifications.ts  # In-app notification system
│   │   │   ├── ai.ts             # OpenAI integration (duplicates, sentiment, release notes)
│   │   │   ├── export.ts         # CSV export (products, ideas, issues)
│   │   │   └── export-pdf.ts     # PDF export (roadmap)
│   │   └── webhooks/
│   │       └── clerk.ts           # Clerk webhook handler
│   ├── styles/
│   │   └── app.css                # Tailwind v4 + Shadcn theme
│   ├── hooks/
│   └── generated/
│       ├── prisma/                # Prisma client output
│       └── zod/                   # Auto-generated Zod schemas
├── tests/
│   ├── e2e/                       # Playwright E2E tests
│   └── unit/                      # Vitest unit tests
├── Dockerfile                     # Multi-stage Bun production build
├── docker-compose.yml             # PostgreSQL 16 + app for local dev
├── docs/
│   └── plans/                     # This documentation
├── vite.config.ts
├── tsconfig.json
├── components.json                # Shadcn UI config
└── package.json
```

## Key Architectural Decisions

### 1. No Separate Backend Server
TanStack Start server functions replace Express/Fastify. All data access happens through `createServerFn()` which runs on the server and is called transparently from components.

### 2. Prisma as Single Source of Truth
The Prisma schema defines all data models. TypeScript types and Zod validation schemas are both generated from it, eliminating type drift. See [Type Safety Strategy](./database-schema.md#type-safety-strategy).

### 3. Clerk for Auth + Multi-Tenancy
Clerk Organizations map 1:1 to application clients. The `@clerk/tanstack-react-start` package provides both client-side components and server-side `auth()` functions. See [Auth & Clerk](./auth-clerk.md).

### 4. Tailwind v4 CSS-First Configuration
All Tailwind theming happens in CSS via `@theme inline` directives. No `tailwind.config.ts` or `postcss.config.js` files. See [UI/UX](./ui-ux-tailwind-shadcn.md).

### 5. SSR with Streaming
TanStack Start streams HTML to the browser during SSR, enabling faster time-to-first-byte. Route data is dehydrated into the HTML for client rehydration.

### 6. Super Admin JWT Auth (Separate from Clerk)
Super Admin uses `jose` for JWT token management (HS256, 8h expiry). The token is stored in an httpOnly, Secure, SameSite=Strict cookie named `sa_token`. The `requireSuperAdmin()` helper in `src/lib/auth.server.ts` reads the cookie via `getRequest()` from `@tanstack/react-start/server` and verifies the JWT.

### 7. In-App Notifications
Database-backed notifications (Prisma `Notification` model) triggered by key events: idea votes, idea status changes, idea/issue comments, issue assignments. Notification triggers are fire-and-forget (`.catch(() => {})`) to avoid blocking the primary operation.

### 8. AI Integration
OpenAI `gpt-4o-mini` model used for duplicate idea detection, sentiment analysis, and release notes generation. The OpenAI client is a singleton in `src/lib/openai.ts` (same pattern as `prisma.ts`).

### 9. Export
CSV export for products, ideas, and issues via server functions returning string content. PDF export for roadmaps via `@react-pdf/renderer` using `React.createElement` for server-side rendering, returning base64-encoded data.
