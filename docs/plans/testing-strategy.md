# Testing Strategy

## Overview

Testing is divided into two layers:
- **E2E tests** (Playwright) -- test user flows through the browser
- **Unit/Integration tests** (Vitest) -- test server functions, utilities, and business logic

## Tools

| Tool | Purpose | Version |
|------|---------|---------|
| Playwright | E2E browser testing | 1.49+ |
| Vitest | Unit & integration tests | 2.1+ |

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

## Test Categories

### 1. Authentication (Clerk)

- User sign-up and sign-in via Clerk UI
- Organization selection/creation
- Redirect to sign-in for unauthenticated access
- Sign-out clears session

### 2. Multi-Tenancy / Data Segregation

- Client A user cannot see Client B's data
- Selecting a different organization switches client context
- API calls are scoped to the active client

### 3. Super Admin Portal

- Super Admin login (separate from Clerk)
- Create/edit/suspend clients
- Cannot access client product data

### 4. Client Admin Functions

- Invite/remove team members via Clerk embedded components
- Change member roles
- Full CRUD on all modules within their client

### 5. Client User Functions

- Standard CRUD operations on products, ideas, roadmap, issues
- Cannot perform admin-only actions (delete product, manage team)
- Cannot access other clients' data

### 6. Module Tests

#### Products
- Create product with form validation
- Edit product details
- Archive product
- Product list filtering and search

#### Ideas
- Submit idea
- Vote on idea
- Add comments
- RICE scoring calculation
- Status transitions
- Promote idea to roadmap

#### Roadmap
- Create roadmap and items
- Move items between statuses (Kanban)
- Assign items to releases
- Timeline view renders correctly

#### Issues
- Create issue with severity
- Assign to team member
- Status transitions
- Customer impact tracking

### 7. UI Components

- Shadcn components render correctly
- Dark mode toggle works
- Responsive layout on mobile viewports

## Test Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── sign-in.spec.ts
│   │   ├── sign-up.spec.ts
│   │   └── organization.spec.ts
│   ├── super-admin/
│   │   ├── client-management.spec.ts
│   │   └── login.spec.ts
│   ├── products/
│   │   ├── product-crud.spec.ts
│   │   └── product-list.spec.ts
│   ├── ideas/
│   │   ├── idea-crud.spec.ts
│   │   ├── idea-voting.spec.ts
│   │   └── idea-promotion.spec.ts
│   ├── roadmap/
│   │   ├── roadmap-crud.spec.ts
│   │   └── roadmap-views.spec.ts
│   ├── issues/
│   │   ├── issue-crud.spec.ts
│   │   └── issue-assignment.spec.ts
│   ├── data-segregation/
│   │   └── tenant-isolation.spec.ts
│   └── fixtures/
│       ├── auth.fixture.ts        # Clerk auth helpers
│       └── seed.fixture.ts        # Test data seeding
├── unit/
│   ├── permissions.test.ts
│   ├── rice-score.test.ts
│   └── utils.test.ts
└── playwright.config.ts
```

## CI Integration

```yaml
# In CI pipeline
- bun install
- bunx prisma generate
- bunx prisma migrate deploy
- bun run prisma:seed
- bun run test               # Vitest unit tests
- bun run test:e2e            # Playwright E2E tests
```

## Test Data

- Seed script creates deterministic test data for each module
- E2E fixtures create fresh Clerk test users per test suite
- Database is reset between test suites in CI
