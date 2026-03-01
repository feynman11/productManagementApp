# Known Issues Module

## Overview

The Issues module tracks known problems, bugs, and customer-reported issues for each product within a client's organization.

## Features

### Issue Tracking
- Create, edit, close issues within a client's product
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW
- Status workflow: OPEN → IN_PROGRESS → RESOLVED / CLOSED / WONT_FIX
- Assignee tracking (Clerk User ID)

### Customer Impact
- Track number of customers affected per issue
- Aggregate impact across issues for prioritization

### Issue Linking
- Link issues to roadmap features for resolution tracking
- Link issues to related ideas

### Issue Analytics (Phase 8)
- Client-specific issue trends over time
- Severity distribution charts
- Mean time to resolution metrics

## Data Model

```prisma
model Issue {
  id              String        @id @default(cuid())
  title           String
  description     String
  severity        IssueSeverity @default(MEDIUM)
  status          IssueStatus   @default(OPEN)
  client          Client        @relation(...)
  clientId        String
  product         Product       @relation(...)
  productId       String
  reporterId      String        // Clerk User ID
  assigneeId      String?       // Clerk User ID
  customersAffected Int         @default(0)
  comments        Comment[]
  @@index([clientId])
  @@index([productId])
  @@index([status])
  @@index([severity])
}

enum IssueSeverity { CRITICAL, HIGH, MEDIUM, LOW }
enum IssueStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED, WONT_FIX }
```

## Server Functions

```
src/server/functions/issues.ts
  ├── getIssues(clientId, productId, filters)   → Issue[]
  ├── getIssue(clientId, issueId)               → Issue with comments
  ├── createIssue(data)                         → Issue
  ├── updateIssue(id, data)                     → Issue
  ├── updateIssueStatus(id, status)             → Issue
  ├── assignIssue(id, assigneeId)               → Issue
  ├── addComment(issueId, content)              → Comment
  └── getIssueAnalytics(clientId, productId)    → Analytics data
```

## Routes

```
src/routes/_authed/$orgSlug/
  ├── products.$productId.issues.tsx            # Issues list for a product
  └── products.$productId.issues.$issueId.tsx   # Issue detail page
```

## Permissions

| Action | CLIENT_ADMIN | CLIENT_USER | CLIENT_VIEWER |
|--------|:---:|:---:|:---:|
| View issues | Y | Y | Y |
| Create issue | Y | Y | N |
| Edit issue | Y | Y | N |
| Change status | Y | Y | N |
| Assign issue | Y | N | N |
| Delete issue | Y | N | N |

## UI Components

- `IssueList` -- Filterable table with severity badges and status indicators
- `IssueForm` -- Create/edit form with severity and product selectors
- `IssueDetail` -- Full view with comments, assignee, and impact tracking
- `SeverityBadge` -- Color-coded severity indicator
- `IssueStatusSelect` -- Status transition dropdown
