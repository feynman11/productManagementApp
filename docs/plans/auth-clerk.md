# Authentication & Authorization with Clerk

## Overview

Authentication and multi-tenancy are handled by **Clerk** via the `@clerk/tanstack-react-start` package, which provides both client-side React components and server-side auth functions purpose-built for TanStack Start.

## Package

```json
{
  "@clerk/tanstack-react-start": "^0.27.14"
}
```

This single package replaces the need for both `@clerk/clerk-react` and `@clerk/clerk-sdk-node`.

## Architecture

```
Client (Browser)                    Server (Bun)
─────────────────                   ────────────────
ClerkProvider                       clerkMiddleware()
  ├── SignedIn / SignedOut             ├── Verifies session token
  ├── UserButton                      ├── Populates auth context
  ├── OrganizationSwitcher            └── Available via auth()
  └── useAuth() / useUser()
       useOrganization()            Server Functions
                                      └── auth() → { userId, orgId, orgRole }
```

## Server-Side Setup

### start.ts (Entry Point)

```typescript
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware()],
  }
})
```

### Server-Side Auth in Server Functions

```typescript
import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'

const fetchAuthData = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  return { userId, orgId, orgRole }
})
```

### Auth Helper (src/lib/auth.server.ts)

```typescript
import { auth } from '@clerk/tanstack-react-start/server'
import { prisma } from './prisma'

export async function requireAuth() {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) throw new Error('Not authenticated')
  return { userId, orgId, orgRole }
}

export async function requireClientAuth() {
  const { userId, orgId, orgRole } = await requireAuth()
  if (!orgId) throw new Error('No organization selected')

  const client = await prisma.client.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, status: true },
  })

  if (!client || client.status !== 'ACTIVE') {
    throw new Error('Client not found or inactive')
  }

  const clientUser = await prisma.clientUser.findUnique({
    where: {
      clerkUserId_clientId: { clerkUserId: userId, clientId: client.id },
    },
    select: { role: true },
  })

  return {
    userId,
    orgId,
    orgRole,
    clientId: client.id,
    clientUserRole: clientUser?.role,
  }
}

export async function requireSuperAdmin() {
  const request = getRequest()
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)sa_token=([^;]+)/)
  const token = match?.[1]

  if (!token) throw new Error('Super admin authentication required')

  try {
    return await verifySuperAdminToken(token)
  } catch {
    throw new Error('Invalid or expired super admin session')
  }
}
```

**Important:** Use `getRequest()` (not `getWebRequest`) from `@tanstack/react-start/server` for accessing raw request headers.

## Client-Side Setup

### Root Route (__root.tsx)

```typescript
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton }
  from '@clerk/tanstack-react-start'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { createRootRoute, Outlet } from '@tanstack/react-router'

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  return { userId }
})

export const Route = createRootRoute({
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth()
    return { userId }
  },
  component: () => (
    <ClerkProvider>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ClerkProvider>
  ),
})
```

### Protected Route Layout (_authed.tsx)

```typescript
import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw new Error('Not authenticated')
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Not authenticated') {
      return <SignIn routing="hash" forceRedirectUrl={window.location.href} />
    }
    throw error
  },
})
```

## User Roles

### Role Hierarchy

| Role | Auth Method | Scope | Permissions |
|------|-----------|-------|-------------|
| Super Admin | Separate login (not Clerk) | Platform-wide | Client CRUD, org provisioning |
| Client Admin | Clerk (org:admin) | Their org only | Full CRUD, team management |
| Client User | Clerk (org:member) | Their org only | Standard CRUD |
| Client Viewer | Clerk (custom role) | Their org only | Read-only access |

### Clerk Organization Role Mapping

```
Clerk org:admin  →  ClientUserRole.CLIENT_ADMIN
Clerk org:member →  ClientUserRole.CLIENT_USER
Clerk custom     →  ClientUserRole.CLIENT_VIEWER
```

### Permission Checking

```typescript
// src/lib/permissions.ts
import type { ClientUserRole } from '~/generated/prisma/client'

const ROLE_HIERARCHY: Record<ClientUserRole, number> = {
  CLIENT_ADMIN: 3,
  CLIENT_USER: 2,
  CLIENT_VIEWER: 1,
}

export function hasPermission(
  userRole: ClientUserRole | undefined,
  requiredRole: ClientUserRole,
): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canWrite(role: ClientUserRole | undefined): boolean {
  return hasPermission(role, 'CLIENT_USER')
}

export function canAdmin(role: ClientUserRole | undefined): boolean {
  return hasPermission(role, 'CLIENT_ADMIN')
}
```

## Clerk Webhook Sync

Clerk webhooks keep the local `Client` and `ClientUser` tables in sync with Clerk's organization data.

### Webhook Endpoint

A dedicated API route handles Clerk webhook events. Since TanStack Start is a full-stack framework, the webhook handler is a server function exposed as an API route.

### Events Handled

| Clerk Event | Action |
|-------------|--------|
| `organization.created` | Create `Client` record |
| `organization.updated` | Update `Client` name/slug |
| `organization.deleted` | Set `Client` status to `INACTIVE` |
| `organizationMembership.created` | Create `ClientUser` record |
| `organizationMembership.updated` | Update `ClientUser` role |
| `organizationMembership.deleted` | Delete `ClientUser` record |

### Webhook Verification

All webhooks are verified using the **Svix** library with the `CLERK_WEBHOOK_SECRET` environment variable.

```typescript
import { Webhook } from 'svix'

const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
const event = wh.verify(payload, {
  'svix-id': svixId,
  'svix-timestamp': svixTimestamp,
  'svix-signature': svixSignature,
})
```

## Environment Variables

```env
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Super Admin JWT auth
SUPER_ADMIN_JWT_SECRET=generate-a-random-256-bit-secret
```

**Important:** `SUPER_ADMIN_JWT_SECRET` must NOT have a `VITE_` prefix — it is server-only.

## Super Admin Authentication

Super Admin auth is **separate from Clerk** to maintain a distinct security boundary for platform-level operations.

### Implementation

- **Password storage**: Argon2 hashing via the `argon2` package
- **JWT tokens**: Created/verified with `jose` library (HS256 algorithm, 8-hour expiry)
- **Cookie**: `sa_token` — httpOnly, Secure, SameSite=Strict, Path=/, Max-Age=28800
- **Secret**: `SUPER_ADMIN_JWT_SECRET` environment variable
- **Login page**: `/super-admin/login`
- **Session check**: `beforeLoad` in `super-admin.tsx` calls `verifySuperAdminSession()`, redirects to login if invalid
- **Route guard**: All super admin server functions in `clients.ts` call `requireSuperAdmin()` before executing

### Server Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `superAdminLogin` | POST | Verify credentials, return JWT + set cookie |
| `superAdminLogout` | POST | Clear `sa_token` cookie |
| `verifySuperAdminSession` | GET | Read cookie, verify JWT, return auth status |

### JWT Payload

```typescript
interface SuperAdminJwtPayload {
  superAdminId: string
  email: string
}
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/jwt.server.ts` | `createSuperAdminToken()` and `verifySuperAdminToken()` |
| `src/lib/auth.server.ts` | `requireSuperAdmin()` helper |
| `src/server/functions/auth.ts` | Login, logout, session verification server functions |
