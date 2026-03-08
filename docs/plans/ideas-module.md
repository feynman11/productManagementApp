# Ideas Module

## Overview

The Ideas module enables collecting, evaluating, and prioritizing product ideas within each client's organization. Ideas flow from submission through review to promotion into roadmap items.

## Features

### Idea Submission
- Submit ideas linked to a specific product
- Rich text description
- Tags for categorization

### Idea Management
- Status workflow: SUBMITTED → UNDER_REVIEW → PLANNED / REJECTED / DUPLICATE
- Voting system (upvote count)
- Comment threads per idea
- Tag-based filtering and search

### Idea Scoring (RICE)
- Reach, Impact, Confidence, Effort fields
- Auto-calculated RICE score: `(Reach * Impact * Confidence) / Effort`
- Sortable by RICE score for prioritization

### AI Features (Implemented)
- **Duplicate detection**: When creating an idea, GPT-4o-mini scans existing ideas for semantic similarity (`detectDuplicateIdeas` in `src/server/functions/ai.ts`)
- **Sentiment analysis**: Admin-only analysis of an idea and its comments, returning sentiment, summary, and numeric score (`analyzeIdeaSentiment`)

### Notifications (Implemented)
- **IDEA_VOTED**: Idea author notified when someone votes on their idea
- **IDEA_STATUS_CHANGED**: Idea author notified when admin changes the status
- **IDEA_COMMENTED**: Idea author notified when someone comments

### Export (Implemented)
- **CSV export**: Download all ideas for a product as CSV with RICE scores, tags, votes, and status (`exportIdeasCsv` in `src/server/functions/export.ts`)

### Idea Promotion
- Promote an idea to a Roadmap Item within the same product
- Links the idea to the resulting roadmap item for traceability

## Data Model

```prisma
model Idea {
  id              String     @id @default(cuid())
  title           String
  description     String
  status          IdeaStatus @default(SUBMITTED)

  client          Client     @relation(fields: [clientId], references: [id], onDelete: Cascade)
  clientId        String
  product         Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId       String
  authorId        String     // Clerk User ID

  riceReach       Int?
  riceImpact      Int?
  riceConfidence  Float?
  riceEffort      Int?
  riceScore       Float?
  votes           Int        @default(0)

  comments        Comment[]
  tags            Tag[]

  @@index([clientId])
  @@index([productId])
  @@index([status])
}

enum IdeaStatus {
  SUBMITTED, UNDER_REVIEW, PLANNED,
  IN_PROGRESS, COMPLETED, REJECTED, DUPLICATE
}
```

## Server Functions

```
src/server/functions/ideas.ts
  ├── getIdeas(clientId, productId, filters)  → Idea[]
  ├── getIdea(clientId, ideaId)               → Idea with comments
  ├── createIdea(data)                        → Idea
  ├── updateIdea(id, data)                    → Idea
  ├── updateIdeaStatus(id, status)            → Idea       (+ IDEA_STATUS_CHANGED notification)
  ├── voteIdea(ideaId)                        → Idea       (+ IDEA_VOTED notification)
  ├── addComment(ideaId, content)             → Comment    (+ IDEA_COMMENTED notification)
  └── promoteToRoadmap(ideaId, roadmapId)     → RoadmapItem

src/server/functions/ai.ts
  ├── detectDuplicateIdeas(productId, title, description)  → { duplicates[] }
  └── analyzeIdeaSentiment(ideaId)                         → { sentiment, summary, score }

src/server/functions/export.ts
  └── exportIdeasCsv(productId)               → { csv, filename }
```

## Routes

```
src/routes/_authed/$orgSlug/
  ├── products.$productId.ideas.tsx           # Ideas list for a product
  └── products.$productId.ideas.$ideaId.tsx   # Idea detail page
```

## Permissions

| Action | CLIENT_ADMIN | CLIENT_USER | CLIENT_VIEWER |
|--------|:---:|:---:|:---:|
| View ideas | Y | Y | Y |
| Submit idea | Y | Y | N |
| Vote on idea | Y | Y | N |
| Comment | Y | Y | N |
| Change status | Y | N | N |
| Score (RICE) | Y | Y | N |
| Promote to roadmap | Y | N | N |

## UI Components

- `IdeaList` -- Filterable, sortable list with status badges
- `IdeaForm` -- TanStack Form with Zod validation
- `IdeaDetail` -- Full view with comments, voting, and RICE scoring
- `RICEScoreCard` -- Visual RICE score breakdown
- `IdeaVoteButton` -- Upvote toggle
- `CommentThread` -- Threaded comments with author info
