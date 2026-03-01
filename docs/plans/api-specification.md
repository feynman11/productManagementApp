# API Specification (Server Functions)

## Overview

ProductPlan has **no separate REST API server**. All server-side logic runs through TanStack Start server functions (`createServerFn`). These are type-safe RPC endpoints that are compiled into client stubs (HTTP fetches) and server handlers automatically.

## Server Function Patterns

### Read Operations (GET)

```typescript
export const getProducts = createServerFn({ method: 'GET' })
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const auth = await requireClientAuth()
    return prisma.product.findMany({
      where: { clientId: auth.clientId },
    })
  })
```

### Write Operations (POST)

```typescript
export const createProduct = createServerFn({ method: 'POST' })
  .validator(ProductCreateInputSchema)  // Generated from Prisma
  .handler(async ({ data }) => {
    const auth = await requireClientAuth()
    return prisma.product.create({
      data: { ...data, clientId: auth.clientId },
    })
  })
```

### Usage in Route Loaders

```typescript
export const Route = createFileRoute('/_authed/$orgSlug/products')({
  loader: async ({ params }) => {
    return getProducts({ data: { clientId: params.orgSlug } })
  },
  component: ProductsPage,
})
```

### Usage with TanStack Query

```typescript
const productsQuery = queryOptions({
  queryKey: ['products', clientId],
  queryFn: () => getProducts({ data: { clientId } }),
})
```

## Server Function Inventory

### Authentication

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `fetchClerkAuth` | GET | none | `{ userId }` | Public |
| `superAdminLogin` | POST | `{ email, password }` | `{ token }` | Public |

### Super Admin: Clients

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getClients` | GET | `{ page, limit }` | `Client[]` | Super Admin |
| `getClient` | GET | `{ clientId }` | `Client` | Super Admin |
| `createClient` | POST | `CreateClientInput` | `Client` | Super Admin |
| `updateClient` | POST | `UpdateClientInput` | `Client` | Super Admin |
| `suspendClient` | POST | `{ clientId }` | `Client` | Super Admin |

### Products

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getProducts` | GET | none | `Product[]` | Client User+ |
| `getProduct` | GET | `{ productId }` | `Product` | Client User+ |
| `createProduct` | POST | `ProductCreateInput` | `Product` | Client User+ |
| `updateProduct` | POST | `ProductUpdateInput` | `Product` | Client User+ |
| `archiveProduct` | POST | `{ productId }` | `Product` | Client Admin |

### Ideas

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getIdeas` | GET | `{ productId, filters? }` | `Idea[]` | Client User+ |
| `getIdea` | GET | `{ ideaId }` | `Idea` | Client User+ |
| `createIdea` | POST | `IdeaCreateInput` | `Idea` | Client User+ |
| `updateIdea` | POST | `IdeaUpdateInput` | `Idea` | Client User+ |
| `updateIdeaStatus` | POST | `{ ideaId, status }` | `Idea` | Client Admin |
| `voteIdea` | POST | `{ ideaId }` | `Idea` | Client User+ |
| `addIdeaComment` | POST | `{ ideaId, content }` | `Comment` | Client User+ |
| `promoteToRoadmap` | POST | `{ ideaId, roadmapId }` | `RoadmapItem` | Client Admin |

### Roadmap

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getRoadmaps` | GET | `{ productId }` | `Roadmap[]` | Client User+ |
| `getRoadmap` | GET | `{ roadmapId }` | `Roadmap` | Client User+ |
| `createRoadmap` | POST | `RoadmapCreateInput` | `Roadmap` | Client User+ |
| `createRoadmapItem` | POST | `RoadmapItemCreateInput` | `RoadmapItem` | Client User+ |
| `updateRoadmapItem` | POST | `RoadmapItemUpdateInput` | `RoadmapItem` | Client User+ |
| `moveRoadmapItem` | POST | `{ id, status, releaseId? }` | `RoadmapItem` | Client User+ |
| `createRelease` | POST | `ReleaseCreateInput` | `Release` | Client Admin |

### Issues

| Function | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `getIssues` | GET | `{ productId, filters? }` | `Issue[]` | Client User+ |
| `getIssue` | GET | `{ issueId }` | `Issue` | Client User+ |
| `createIssue` | POST | `IssueCreateInput` | `Issue` | Client User+ |
| `updateIssue` | POST | `IssueUpdateInput` | `Issue` | Client User+ |
| `assignIssue` | POST | `{ issueId, assigneeId }` | `Issue` | Client Admin |
| `addIssueComment` | POST | `{ issueId, content }` | `Comment` | Client User+ |

### Webhooks

| Route | Method | Input | Output | Auth |
|-------|--------|-------|--------|------|
| `/api/webhooks/clerk` | POST | Clerk event payload | `200 OK` | Svix signature |

## Input Validation

All input schemas are auto-generated from `prisma/schema.prisma` via `prisma-zod-generator`. Server functions use `.validator()` to validate and type-narrow inputs before reaching the handler.

## Error Handling

Server functions throw errors that are serialized and sent to the client. Standard patterns:

```typescript
// Authentication error
throw new Error('Not authenticated')  // → handled by _authed errorComponent

// Authorization error
throw new Error('Insufficient permissions')

// Not found
throw new Error('Resource not found')

// Validation errors are handled automatically by .validator()
```

## Middleware

Server functions use composable middleware for cross-cutting concerns:

```typescript
const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await auth()
    if (!session.userId) throw new Error('Not authenticated')
    return next({ context: { userId: session.userId } })
  },
)

export const protectedFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.userId is typed and available
  })
```
