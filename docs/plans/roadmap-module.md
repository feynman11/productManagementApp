# Roadmap Module

## Overview

The Roadmap module provides visual planning tools for product development. Each product can have multiple roadmaps, containing items organized by releases and timeframes.

## Features

### Roadmap Views
- **Timeline/Gantt** -- Horizontal timeline with items as bars
- **Kanban** -- Column-based board (Backlog → Planned → In Progress → Done)
- **List** -- Tabular view with sorting and filtering
- **Portfolio** -- Rollup view across all products for a client

### Release Planning
- Create releases with target dates
- Assign roadmap items to releases
- Track release progress (% of items completed)

### Feature Management
- Create roadmap items with title, description, status, priority
- Set start/end dates for timeline positioning
- Link items to originating ideas for traceability

### Dependencies (Phase 6)
- Map dependencies between roadmap items
- Visual dependency graph
- Block/unblock status based on dependency completion

### Roadmap Publishing
- Toggle roadmap visibility (public/private)
- Public roadmaps accessible without authentication (future)

### Export (Implemented)
- **PDF export**: Download roadmap overview with items and releases as PDF (`exportRoadmapPdf` in `src/server/functions/export-pdf.ts`, uses `@react-pdf/renderer`)

### AI Features (Implemented)
- **Release notes generation**: Auto-generate markdown release notes from a release's roadmap items (`generateReleaseNotes` in `src/server/functions/ai.ts`, uses GPT-4o-mini)

### Capacity Planning (Future)
- Team capacity tracking per sprint/release
- Load balancing visualization

## Data Model

```prisma
model Roadmap {
  id          String        @id @default(cuid())
  name        String
  description String?
  client      Client        @relation(...)
  clientId    String
  product     Product       @relation(...)
  productId   String
  items       RoadmapItem[]
  releases    Release[]
  isPublic    Boolean       @default(false)
  @@index([clientId])
  @@index([productId])
}

model RoadmapItem {
  id          String            @id @default(cuid())
  title       String
  description String?
  status      RoadmapItemStatus @default(BACKLOG)
  priority    Int               @default(0)
  roadmap     Roadmap           @relation(...)
  roadmapId   String
  release     Release?          @relation(...)
  releaseId   String?
  startDate   DateTime?
  endDate     DateTime?
  @@index([roadmapId])
  @@index([releaseId])
}

model Release {
  id          String        @id @default(cuid())
  name        String
  targetDate  DateTime?
  status      ReleaseStatus @default(PLANNED)
  roadmap     Roadmap       @relation(...)
  roadmapId   String
  items       RoadmapItem[]
  @@index([roadmapId])
}

enum RoadmapItemStatus { BACKLOG, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED }
enum ReleaseStatus { PLANNED, IN_PROGRESS, RELEASED, CANCELLED }
```

## Server Functions

```
src/server/functions/roadmap.ts
  ├── getRoadmaps(clientId, productId)                → Roadmap[]
  ├── getRoadmap(clientId, roadmapId)                 → Roadmap with items/releases
  ├── createRoadmap(data)                             → Roadmap
  ├── updateRoadmap(id, data)                         → Roadmap
  ├── createRoadmapItem(roadmapId, data)              → RoadmapItem
  ├── updateRoadmapItem(id, data)                     → RoadmapItem
  ├── moveRoadmapItem(id, status, releaseId?)         → RoadmapItem
  ├── createRelease(roadmapId, data)                  → Release
  ├── updateRelease(id, data)                         → Release
  └── getPortfolioView(clientId)                      → Aggregated roadmap data

src/server/functions/export-pdf.ts
  └── exportRoadmapPdf(roadmapId)                     → { pdf (base64), filename }

src/server/functions/ai.ts
  └── generateReleaseNotes(releaseId)                  → { markdown }
```

## Routes

```
src/routes/_authed/$orgSlug/
  ├── products.$productId.roadmap.tsx                 # Roadmap views
  └── products.$productId.roadmap.$roadmapId.tsx      # Specific roadmap detail
```

## Permissions

| Action | CLIENT_ADMIN | CLIENT_USER | CLIENT_VIEWER |
|--------|:---:|:---:|:---:|
| View roadmaps | Y | Y | Y |
| Create roadmap | Y | Y | N |
| Edit roadmap items | Y | Y | N |
| Manage releases | Y | N | N |
| Toggle public | Y | N | N |
| Delete roadmap | Y | N | N |

## UI Components

- `RoadmapTimeline` -- Horizontal Gantt-style timeline
- `RoadmapKanban` -- Drag-and-drop Kanban board (dnd-kit)
- `RoadmapList` -- Table view with Shadcn Table
- `RoadmapItemCard` -- Card component for items
- `ReleaseManager` -- Create/edit releases with date pickers
- `PortfolioView` -- Cross-product roadmap rollup
