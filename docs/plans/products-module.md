# Products Module

## Overview

The Products module enables clients to manage their product portfolio. Each product belongs to a single client and serves as the container for Ideas, Roadmaps, and Issues.

## Features

### Product Portfolio Management
- Create, edit, and archive products within a client's organization
- Product list with search, filtering by status, and sorting
- Product detail page with overview, strategy, and linked modules

### Product Strategy
- Define vision statement per product
- Define strategy documentation per product
- Future: OKRs and metrics tracking via Goals model

### Product Dashboard
- Client-scoped dashboard showing aggregate stats
- Counts of ideas, roadmap items, and issues per product
- Quick-access links to each product's sub-modules

## Data Model

```prisma
model Product {
  id          String        @id @default(cuid())
  name        String
  description String?
  vision      String?
  strategy    String?
  status      ProductStatus @default(ACTIVE)
  color       String        @default("#3B82F6")
  icon        String?

  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  members     ProductMember[]
  ideas       Idea[]
  roadmaps    Roadmap[]
  issues      Issue[]
  goals       Goal[]

  @@index([clientId])
  @@unique([clientId, name])
}

enum ProductStatus { ACTIVE, ARCHIVED, DRAFT }
```

## Server Functions

```
src/server/functions/products.ts
  ├── getProducts(clientId)           → Product[]
  ├── getProduct(clientId, productId) → Product with counts
  ├── createProduct(data)             → Product
  ├── updateProduct(id, data)         → Product
  ├── archiveProduct(id)              → Product
  └── getProductDashboard(clientId)   → Dashboard stats
```

### Example

```typescript
export const getProducts = createServerFn({ method: 'GET' })
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    return prisma.product.findMany({
      where: { clientId },
      include: {
        _count: { select: { ideas: true, roadmaps: true, issues: true } },
      },
      orderBy: { name: 'asc' },
    })
  })
```

## Routes

```
src/routes/_authed/$orgSlug/
  ├── products.tsx              # Product list page
  ├── products.new.tsx          # Create product form
  └── products.$productId.tsx   # Product detail (tabs: overview, ideas, roadmap, issues)
```

## Permissions

| Action | CLIENT_ADMIN | CLIENT_USER | CLIENT_VIEWER |
|--------|:---:|:---:|:---:|
| View products | Y | Y | Y |
| Create product | Y | Y | N |
| Edit product | Y | Y | N |
| Archive product | Y | N | N |
| Manage members | Y | N | N |

## UI Components

- `ProductList` -- Table/grid view using Shadcn Table + Card
- `ProductForm` -- Create/edit form using TanStack Form + generated Zod schemas
- `ProductCard` -- Summary card with color indicator and stats
- `ProductDetail` -- Tabbed view with sub-module navigation
