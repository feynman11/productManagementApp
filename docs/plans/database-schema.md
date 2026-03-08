# Database Schema

## Overview

PostgreSQL 16+ is the primary data store. Prisma 7 is the ORM and the **single source of truth** for all data types. Every model type, enum, and relation is defined in `prisma/schema.prisma` and flows outward to TypeScript types and Zod validation schemas.

## Prisma 7 Configuration

Prisma 7 introduces breaking changes from v6:

### prisma.config.ts (project root)

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun run prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### Generator Block (schema.prisma)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma/client"
}

generator zod {
  provider       = "prisma-zod-generator"
  output         = "../src/generated/zod"
  modelSuffix    = "Schema"
  isGenerateSelect  = true
  isGenerateInclude = true
}
```

### Driver Adapter (Prisma 7 requirement)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })
```

## Type Safety Strategy

```
prisma/schema.prisma  (Single Source of Truth)
        │
        ├──► prisma generate
        │       ├──► src/generated/prisma/client/   (TypeScript types)
        │       └──► src/generated/zod/             (Zod validation schemas)
        │
        ├──► Server Functions use Prisma types for DB operations
        ├──► Server Functions use Zod schemas for input validation
        └──► Components infer types from server function return types
```

### Using Generated Types

```typescript
// Prisma types (for DB operations)
import type { Product, Idea } from '~/generated/prisma/client'

// Zod schemas (for runtime validation)
import { ProductSchema, IdeaCreateInputSchema } from '~/generated/zod'

// In a server function
export const createProduct = createServerFn({ method: 'POST' })
  .validator(ProductCreateInputSchema)  // Generated Zod schema
  .handler(async ({ data }) => {
    return prisma.product.create({ data })  // Prisma types
  })
```

### Zod Schema Annotations in Prisma

Use rich comments in `schema.prisma` to add validation rules that flow into generated Zod schemas:

```prisma
model Product {
  id          String        @id @default(cuid())
  /// @zod.string.min(1).max(100)
  name        String
  /// @zod.string.max(500)
  description String?
  status      ProductStatus @default(ACTIVE)
  /// @zod.string.regex(/^#[0-9A-Fa-f]{6}$/)
  color       String        @default("#3B82F6")

  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  @@index([clientId])
  @@unique([clientId, name])
}
```

This generates:

```typescript
// Auto-generated in src/generated/zod/
export const ProductSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  status: ProductStatusSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  clientId: z.string(),
})
```

## Schema Models

### Multi-Tenancy Models

```prisma
model SuperAdmin {
  id            String   @id @default(cuid())
  /// @zod.string.email()
  email         String   @unique
  passwordHash  String
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Client {
  id            String        @id @default(cuid())
  /// @zod.string.min(1).max(100)
  name          String        @unique
  /// @zod.string.min(1).max(50).regex(/^[a-z0-9-]+$/)
  slug          String        @unique
  clerkOrgId    String?       @unique
  status        ClientStatus  @default(PENDING_SETUP)

  clientUsers   ClientUser[]
  products      Product[]
  ideas         Idea[]
  roadmaps      Roadmap[]
  issues        Issue[]
  notifications Notification[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([status])
  @@index([clerkOrgId])
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  PENDING_SETUP
  SUSPENDED
}

model ClientUser {
  id            String          @id @default(cuid())
  clerkUserId   String
  client        Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId      String
  role          ClientUserRole

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([clerkUserId, clientId])
  @@index([clerkUserId])
  @@index([clientId])
}

enum ClientUserRole {
  CLIENT_ADMIN
  CLIENT_USER
  CLIENT_VIEWER
}
```

### Core Business Models

```prisma
enum ProductStatus {
  ACTIVE
  ARCHIVED
  DRAFT
}

model Product {
  id          String        @id @default(cuid())
  /// @zod.string.min(1).max(100)
  name        String
  /// @zod.string.max(500)
  description String?
  vision      String?
  strategy    String?
  status      ProductStatus @default(ACTIVE)
  /// @zod.string.regex(/^#[0-9A-Fa-f]{6}$/)
  color       String        @default("#3B82F6")
  icon        String?

  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  members     ProductMember[]
  ideas       Idea[]
  roadmaps    Roadmap[]
  issues      Issue[]
  goals       Goal[]
  customFields CustomField[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([clientId])
  @@unique([clientId, name])
}

enum ProductMemberRole {
  LEAD
  MEMBER
}

model ProductMember {
  id          String            @id @default(cuid())
  product     Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String
  clerkUserId String
  role        ProductMemberRole

  client      Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  createdAt   DateTime          @default(now())

  @@unique([productId, clerkUserId])
  @@index([productId])
  @@index([clerkUserId])
  @@index([clientId])
}

enum IdeaStatus {
  SUBMITTED
  UNDER_REVIEW
  PLANNED
  IN_PROGRESS
  COMPLETED
  REJECTED
  DUPLICATE
}

model Idea {
  id              String     @id @default(cuid())
  /// @zod.string.min(1).max(200)
  title           String
  description     String
  status          IdeaStatus @default(SUBMITTED)

  client          Client     @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId        String

  product         Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId       String
  authorId        String     // Clerk User ID

  // RICE scoring
  riceReach       Int?
  riceImpact      Int?
  riceConfidence  Float?
  riceEffort      Int?
  riceScore       Float?

  votes           Int        @default(0)

  comments        Comment[]
  tags            Tag[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([clientId])
  @@index([productId])
  @@index([authorId])
  @@index([status])
}

model Roadmap {
  id          String        @id @default(cuid())
  /// @zod.string.min(1).max(100)
  name        String
  description String?

  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  product     Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String

  items       RoadmapItem[]
  releases    Release[]

  isPublic    Boolean       @default(false)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([clientId])
  @@index([productId])
}

enum RoadmapItemStatus {
  BACKLOG
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model RoadmapItem {
  id          String            @id @default(cuid())
  /// @zod.string.min(1).max(200)
  title       String
  description String?
  status      RoadmapItemStatus @default(BACKLOG)
  priority    Int               @default(0)

  roadmap     Roadmap           @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  roadmapId   String

  release     Release?          @relation(fields: [releaseId], references: [id])
  releaseId   String?

  startDate   DateTime?
  endDate     DateTime?

  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([roadmapId])
  @@index([releaseId])
}

model Release {
  id          String        @id @default(cuid())
  /// @zod.string.min(1).max(100)
  name        String
  description String?
  targetDate  DateTime?
  status      ReleaseStatus @default(PLANNED)

  roadmap     Roadmap       @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  roadmapId   String

  items       RoadmapItem[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([roadmapId])
}

enum ReleaseStatus {
  PLANNED
  IN_PROGRESS
  RELEASED
  CANCELLED
}

enum IssueSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
  WONT_FIX
}

model Issue {
  id              String        @id @default(cuid())
  /// @zod.string.min(1).max(200)
  title           String
  description     String
  severity        IssueSeverity @default(MEDIUM)
  status          IssueStatus   @default(OPEN)

  client          Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId        String

  product         Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId       String
  reporterId      String        // Clerk User ID
  assigneeId      String?       // Clerk User ID

  customersAffected Int         @default(0)

  comments        Comment[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([clientId])
  @@index([productId])
  @@index([status])
  @@index([severity])
}

model Goal {
  id          String   @id @default(cuid())
  /// @zod.string.min(1).max(200)
  title       String
  description String?
  targetValue Float?
  currentValue Float?

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([productId])
}

model Comment {
  id          String   @id @default(cuid())
  content     String
  authorId    String   // Clerk User ID

  idea        Idea?    @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  ideaId      String?

  issue       Issue?   @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId     String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([ideaId])
  @@index([issueId])
  @@index([authorId])
}

model Tag {
  id      String @id @default(cuid())
  name    String
  ideas   Idea[]

  @@unique([name])
}

model CustomField {
  id          String  @id @default(cuid())
  name        String
  fieldType   String  // "text", "number", "date", "select"
  options     Json?   // For select-type fields

  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId   String

  @@index([productId])
}
```

## Data Isolation

Every query to core business data **must** include a `clientId` WHERE clause. This is enforced by:

1. **Server-side auth helper** that extracts `clientId` from the Clerk organization context
2. **Prisma middleware/extension** that validates `clientId` is always present on queries
3. **Unique constraints** that prevent cross-client data collisions (e.g., `@@unique([clientId, name])`)

### Notification Model

```prisma
enum NotificationType {
  IDEA_VOTED
  IDEA_STATUS_CHANGED
  IDEA_COMMENTED
  ISSUE_ASSIGNED
  ISSUE_COMMENTED
}

model Notification {
  id          String           @id @default(cuid())
  recipientId String           // Clerk User ID
  type        NotificationType
  title       String
  message     String
  read        Boolean          @default(false)

  client      Client           @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId    String

  ideaId      String?
  issueId     String?

  createdAt   DateTime         @default(now())

  @@index([recipientId, clientId])
  @@index([recipientId, read])
}
```

Notifications are created via fire-and-forget helpers in `src/lib/notifications.server.ts`. They are triggered by server functions in `ideas.ts` and `issues.ts` and queried via `src/server/functions/notifications.ts`.

## Seed Script

See `prisma/seed.ts` for development data. Seed creates:
- 1 Super Admin (email: `superadmin@productplan.com`, password: `admin123`, argon2-hashed)
- 2 sample Clients with mock Clerk Org IDs
- Sample Products, Ideas, Roadmap items, Issues, and Notifications per client
