# SaaS Multi-Tenancy Strategy

## Isolation Model

**Strict data segregation** -- every core business record carries a `clientId` foreign key. There is no shared schema or database-per-tenant; all clients share one PostgreSQL database with row-level isolation.

## Tenant Hierarchy

```
Platform (Super Admin)
  └── Client (Clerk Organization = 1 tenant)
        ├── ClientUser (Clerk Organization Member)
        ├── Products
        │     ├── Ideas
        │     ├── Roadmap → RoadmapItems → Releases
        │     └── Issues
        └── Settings
```

## Clerk Organizations as Tenants

Each `Client` in the database maps 1:1 to a **Clerk Organization**:

| Our Model | Clerk Concept |
|-----------|--------------|
| `Client` | Organization |
| `Client.clerkOrgId` | `organization.id` |
| `Client.slug` | `organization.slug` |
| `ClientUser` | Organization Membership |
| `ClientUser.clerkUserId` | `membership.userId` |
| `ClientUserRole.CLIENT_ADMIN` | `org:admin` |
| `ClientUserRole.CLIENT_USER` | `org:member` |
| `ClientUserRole.CLIENT_VIEWER` | Custom Clerk role |

## URL-Based Organization Sync

Clerk's `clerkMiddleware()` supports automatic organization activation based on URL patterns:

```typescript
// src/start.ts
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    clerkMiddleware({
      organizationSyncOptions: {
        organizationPatterns: [
          '/org/:slug',
          '/org/:slug/(.*)',
        ],
      },
    }),
  ],
}))
```

When a user visits `/org/acme-corp/products`, Clerk automatically activates the `acme-corp` organization in their session, making `auth().orgId` and `auth().orgSlug` available in server functions.

## Data Isolation Enforcement

### Layer 1: Server Function Auth Helper

Every server function that accesses client data calls `requireClientAuth()`:

```typescript
export async function requireClientAuth() {
  const { userId, orgId, orgRole } = await auth()
  if (!userId || !orgId) throw new Error('No organization selected')

  const client = await prisma.client.findUnique({
    where: { clerkOrgId: orgId },
  })

  if (!client || client.status !== 'ACTIVE') {
    throw new Error('Client not found or inactive')
  }

  return { userId, clientId: client.id, orgRole }
}
```

### Layer 2: Prisma Queries Always Scoped

All queries include `clientId` in the WHERE clause:

```typescript
// Correct: scoped to client
const products = await prisma.product.findMany({
  where: { clientId: auth.clientId },
})

// NEVER: unscoped query on business data
const products = await prisma.product.findMany() // ❌
```

### Layer 3: Database Constraints

Unique constraints prevent cross-client collisions:

```prisma
model Product {
  @@unique([clientId, name])  // Same product name OK across different clients
}
```

## Client Lifecycle

```
PENDING_SETUP → ACTIVE → SUSPENDED → INACTIVE
     │              │         │
     │              │         └── Can be reactivated by Super Admin
     │              └── Super Admin can suspend for billing/policy
     └── Created via Clerk webhook or Super Admin portal
```

### Provisioning Flow

1. Super Admin creates a Client in the Super Admin portal
2. Backend creates a Clerk Organization via Clerk Admin API
3. Clerk sends `organization.created` webhook
4. Webhook handler links `clerkOrgId` to the `Client` record
5. Client Admin is invited to the Clerk Organization
6. Clerk sends `organizationMembership.created` webhook
7. Webhook handler creates `ClientUser` record with `CLIENT_ADMIN` role

### Deprovisioning

1. Super Admin sets Client status to `SUSPENDED` or `INACTIVE`
2. All server functions check `client.status === 'ACTIVE'` before serving data
3. Optionally delete/archive the Clerk Organization

## Super Admin

The Super Admin operates **outside** Clerk's tenant model:

- Separate authentication (email + password with argon2)
- Dedicated routes under `/_authed/_super-admin/`
- Can view/manage all Client records but cannot access client product data
- Can provision/deprovision Clerk Organizations

## Data Segregation Checklist

For every new model added to the schema:

- [ ] Add `clientId String` field with `@relation` to `Client`
- [ ] Add `@@index([clientId])`
- [ ] Add `clientId` to relevant unique constraints
- [ ] Ensure all server functions include `clientId` in queries
- [ ] Add `Client` relation to the model's `Client` model relations list
