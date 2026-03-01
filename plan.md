Complete Development Plan: ProductPlan (SaaS)

Table of Contents

1. Executive Summary

2. Tech Stack & Versions

3. Documentation Structure

4. Core Feature Requirements

5. SaaS Architecture & Authentication (Clerk)
	- Multi-Tenancy Strategy

	- Authentication & Authorization

	- User Roles

	- Client Management (Super Admin)

	- Team Management (Client Admin)


6. UI/UX with Tailwind CSS & Shadcn UI

7. Database Schema

8. Frontend Architecture

9. Backend Architecture

10. Testing Strategy

11. Development Phases

12. Deployment & DevOps


---

Executive Summary


ProductPlan is a modern, high-performance SaaS product management application designed for multi-tenant environments. It empowers clients to manage their products, gather and prioritize ideas, plan strategic roadmaps, and track known issues within their dedicated team spaces. The application leverages a cutting-edge tech stack, including Bun Runtime, React 19, TypeScript 5.7, Prisma 7, Tailwind CSS with Shadcn UI, and Clerk for robust authentication and multi-tenancy.

Key Objectives:


- Deliver a secure, scalable, and performant SaaS platform.

- Implement strong data segregation between clients.

- Provide intuitive user experiences through a modern UI.

- Achieve high test coverage for critical business logic.

- Enable efficient product management for teams and clients.

Timeline: 18 weeks (1 week setup + 17 weeks development)

Team: 3-4 full-stack developers + 1 QA engineer


---

Tech Stack & Versions

Runtime

- Bun: v1.3.10 (latest stable as of 2026-03-01) - For both frontend (bundling, dev server) and backend execution.

Frontend Stack

	{
	  "react": "^19.2.4",
	  "typescript": "^5.7.3",
	  "@tanstack/react-query": "^5.90.21",
	  "@tanstack/react-router": "^1.93.3",
	  "@tanstack/react-form": "^0.41.0",
	  "@clerk/clerk-react": "^5.61.0",
	  "tailwindcss": "^4.0.0-next.1",
	  "class-variance-authority": "^0.7.0",
	  "clsx": "^2.1.1",
	  "tailwind-merge": "^2.3.0",
	  "lucide-react": "^0.395.0",
	  "@radix-ui/react-slot": "^1.1.0",
	  "shadcn-ui": "latest"
	}

Backend Stack

	{
	  "@prisma/client": "^7.4.2",
	  "@clerk/clerk-sdk-node": "^1.28.0",
	  "express": "^4.21.2",
	  "zod": "^3.24.1"
	}

Testing & Quality

	{
	  "@playwright/test": "^1.49.1",
	  "prisma": "^7.4.2",
	  "eslint": "^9.18.0",
	  "prettier": "^3.4.2"
	}

Database

- PostgreSQL: 16+ (Primary data store)

- Redis: 7+ (Caching & session management for Clerk's webhook processing)

Key Technology Updates & Changes

- Bun Runtime: Replaces Node.js for backend execution and Vite for frontend bundling/dev server, leveraging its speed and all-in-one tooling.

- Clerk: Used for authentication, user management, and organization (client/team) handling, simplifying SaaS multi-tenancy.

- Tailwind CSS 4: Utilized for utility-first styling.

- Shadcn UI: Provides accessible, customizable React components, integrated with Tailwind CSS. Components will be copied into the project.

- Prisma 7: Confirmed as the latest for performance and Rust-free operations.


---

Documentation Structure

Required Repository Structure

	productplan/
	├── docs/
	│   ├── README.md                          # Main entry point for developers
	│   ├── plans/
	│   │   ├── architecture.md                # System design & core services
	│   │   ├── saas-multi-tenancy.md          # Multi-tenancy strategy & client isolation
	│   │   ├── auth-clerk.md                  # Clerk integration & roles
	│   │   ├── products-module.md             # Products features
	│   │   ├── ideas-module.md                # Ideas features
	│   │   ├── roadmap-module.md              # Roadmap features
	│   │   ├── issues-module.md               # Issues features
	│   │   ├── database-schema.md             # Data models & relations
	│   │   ├── api-specification.md           # Internal API endpoints
	│   │   ├── testing-strategy.md            # Test plans & coverage
	│   │   ├── deployment.md                  # Deployment & infrastructure
	│   │   └── development-guide.md           # Local setup & workflow
	│   ├── api/
	│   │   ├── clients-api.md                 # Super admin API for client management
	│   │   ├── teams-api.md                   # Client admin API for team management
	│   │   ├── products-endpoints.md
	│   │   ├── ideas-endpoints.md
	│   │   ├── roadmap-endpoints.md
	│   │   └── issues-endpoints.md
	│   ├── components/
	│   │   └── ui-component-library.md        # Shadcn UI customization & usage
	│   ├── diagrams/
	│   │   ├── architecture.svg
	│   │   ├── multi-tenancy-model.svg
	│   │   ├── auth-flow-clerk.svg
	│   │   ├── deployment.svg
	│   └── images/
	│       └── wireframes/
	├── prisma/
	│   ├── schema.prisma
	│   ├── migrations/
	│   └── seed.ts
	├── bunfig.toml                            # Bun configuration file
	├── tailwind.config.ts                     # Tailwind CSS configuration
	├── postcss.config.js                      # PostCSS configuration for Tailwind
	├── src/                                   # Frontend source
	│   ├── app/
	│   ├── components/
	│   │   ├── ui/                            # Shadcn UI components (copied in)
	│   │   ├── layouts/                       # Main application layouts
	│   │   ├── auth/                          # Clerk specific components
	│   │   └── super-admin/                   # Super Admin UI
	│   ├── hooks/
	│   ├── lib/
	│   ├── routes/
	│   ├── styles/
	│   └── types/
	├── server/                                # Backend source (Fastify recommended with Bun)
	│   ├── src/
	│   │   ├── index.ts                       # Entry point
	│   │   ├── plugins/                       # Fastify plugins
	│   │   ├── routes/
	│   │   ├── services/
	│   │   ├── middleware/                    # Custom server middleware (e.g., Clerk webhook)
	│   │   └── utils/
	│   └── prisma/
	│       └── client.ts
	├── tests/
	│   ├── e2e/
	│   ├── fixtures/
	│   └── playwright.config.ts
	├── package.json
	├── tsconfig.json
	└── README.md                              # Public-facing project overview

Root README.md

	# ProductPlan
	
	A modern SaaS product management application.
	
	## 🚀 Quick Start
	
	```bash
	# Install dependencies with Bun
	bun install
	
	# Setup database (ensure PostgreSQL is running)
	bun run prisma:migrate:dev
	bun run prisma:seed # Only for dev/test environments
	
	# Configure Clerk environment variables (see .env.example)
	
	# Start development servers
	bun run dev          # Frontend (Bun + Vite HMR)
	bun run server:dev   # Backend API (Bun runtime)
	
	# Run tests
	bun run test:e2e
	```
	
	## 📚 Documentation
	
	Comprehensive documentation for developers and administrators is available in the `/docs` folder:
	
	-   **[Architecture Overview](/docs/plans/architecture.md)** - System design & tech stack
	-   **[SaaS Multi-Tenancy Model](/docs/plans/saas-multi-tenancy.md)** - Client isolation & roles
	-   **[Authentication with Clerk](/docs/plans/auth-clerk.md)** - Clerk integration details
	-   **[UI/UX with Shadcn UI & Tailwind CSS](/docs/components/ui-component-library.md)** - Design system
	-   **[Development Guide](/docs/plans/development-guide.md)** - Local setup & workflow
	
	### Module Documentation
	-   [Products Module](/docs/plans/products-module.md)
	-   [Ideas Module](/docs/plans/ideas-module.md)
	-   [Roadmap Module](/docs/plans/roadmap-module.md)
	-   [Issues Module](/docs/plans/issues-module.md)
	
	## 🏗️ Tech Stack
	
	-   **Runtime**: Bun v1.3.10
	-   **Frontend**: React 19.2.4, TypeScript 5.7.3, TanStack Query v5, TanStack Router v1
	-   **UI**: Tailwind CSS 4, Shadcn UI
	-   **Authentication**: Clerk (@clerk/clerk-react v5.61.0, @clerk/clerk-sdk-node v1.28.0)
	-   **Backend**: Bun, Express (or Fastify for Bun), Prisma 7.4.2
	-   **Database**: PostgreSQL 16+
	-   **Testing**: Playwright, Vitest
	
	## 🎯 Features
	
	-   ✅ Multi-tenant SaaS architecture
	-   ✅ Super Admin portal for client management
	-   ✅ Client Admin portal for team management
	-   ✅ Product Portfolio, Ideas, Roadmap, and Issues Management
	-   ✅ AI-Powered Idea Clustering
	-   ✅ Real-time Collaboration (via WebSockets if needed)
	
	## 📖 Contributing
	
	See [Development Guide](/docs/plans/development-guide.md) for detailed contribution guidelines.
	
	## 📄 License
	
	MIT


---

Core Feature Requirements (ProductPlan)


(Same as previous plan, but contextualized within the SaaS model)

1. Products Module

- Product Portfolio Management: Create/edit/archive products within a client's organization.

- Product Strategy: Define vision, OKRs, and metrics per product, per client.

- Product Dashboard: Client-specific dashboards.

2. Ideas Module

- Idea Submission: Client-specific public/private portals.

- Idea Management: Voting, comments, tags within a client's context.

- Idea Scoring: RICE/custom scoring within a client's configurations.

- AI Features: Duplicate detection, clustering, sentiment analysis client-segregated.

- Idea Promotion: Promote to roadmap within the client's product.

3. Roadmap Module

- Roadmap Views: Timeline, Kanban, List, Portfolio rollup for a client's products.

- Release Planning: Release creation per client product.

- Feature Management: Features within a client's product.

- Dependencies: Mapping within a client's roadmap.

- Roadmap Publishing: Client-specific public/private roadmaps.

- Capacity Planning: Client-specific team capacity.

4. Known Issues Module

- Issue Tracking: Create/edit/close issues within a client's product.

- Customer Impact: Track impact per client.

- Issue Linking: Link to features/ideas within client's data.

- Issue Analytics: Client-specific issue trends.


---

SaaS Architecture & Authentication (Clerk)

Multi-Tenancy Strategy


Isolation Model: Strict Data Segregation (separate client_id on every core data record).


1. 
Clients Table: A top-level table managed only by the Super Admin. Each row represents a paying client organization.



	// Add to prisma/schema.prisma
	model Client {
	  id            String          @id @default(cuid())
	  name          String          @unique
	  slug          String          @unique // e.g., 'acme-corp' for subdomain/path routing
	  status        ClientStatus    @default(ACTIVE)
	  
	  // Relations for data segregation
	  products      Product[]
	  users         ClientUser[] // Users belonging to this client, managed by Clerk and synced
	  
	  createdAt     DateTime        @default(now())
	  updatedAt     DateTime        @updatedAt
	  
	  @@index([status])
	}
	
	enum ClientStatus {
	  ACTIVE
	  INACTIVE
	  PENDING_SETUP
	  SUSPENDED
	}



2. 
Clerk Organizations: Each Client in the database will correspond to a Clerk Organization. This allows Clerk to manage users and roles within each client's team.


	- Clerk Organization ID (orgId) will be stored in our Client table.

	- Clerk User IDs (userId) will be linked to specific clients via ClientUser table.


3. 
Data Isolation: Every core business object (Product, Idea, Roadmap, Issue, etc.) will have a clientId foreign key, ensuring queries are always scoped to the active client.



Authentication & Authorization (Clerk)

1. 


Clerk Frontend Integration:


	- Use @clerk/clerk-react for seamless authentication flows (sign-up, sign-in, user profiles, organization selection).

	- ClerkProvider wraps the application.

	- SignedIn, SignedOut, RedirectToSignIn, RedirectToUserProfile components for routing.

	- useUser(), useAuth(), useOrganization() hooks for accessing user and organization data.


2. 
Clerk Backend Integration:


	- Use @clerk/clerk-sdk-node to verify tokens on the backend.

	- Clerk Webhooks: Crucial for syncing Clerk Organization/User changes to the backend Client and ClientUser tables.
		- Webhook endpoints will be implemented to listen for organization.created, organization.updated, user.created, user.updated, organizationMembership.created, etc., to keep our Client and ClientUser tables in sync.



3. 
Authorization:


	- Client Scoping: All API requests for business data must include the active clientId (derived from Clerk's orgId of the current active organization). Middleware will enforce this.

	- Role-Based Access Control (RBAC):
		- Super Admin: Managed outside Clerk, through a separate dedicated login or hardcoded in bunfig.toml during dev. Accesses Client data directly.

		- Client Admin: Clerk Organization Administrator. Manages users within their own client's organization using Clerk's Admin SDK or embedded components. Can perform all product management tasks for their client.

		- Client User: Clerk Organization Member. Can perform standard product management tasks.

		- Client Viewer: Clerk Organization Member with read-only access.



User Roles

1. 


Super Admin:


	- Authentication: Separate login, or specific environment variable/database check (NOT through Clerk directly for core SaaS client management).

	- Permissions: Create/manage Client records in the database. Provision/deprovision Clerk Organizations for clients. Manage subscription billing. No direct access to client's product data by default (unless specifically designed for auditing).

	- UI: Dedicated Super Admin portal (e.g., /super-admin).


2. 
Client Admin:


	- Authentication: Via Clerk. Belongs to a Clerk Organization.

	- Permissions: Full CRUD on Products, Ideas, Roadmaps, Issues within their assigned Client. Can invite/remove users from their Clerk Organization (i.e., their team) using Clerk's user management components/SDK. Manage roles (Client Admin, Client User, Client Viewer) for their team members.

	- UI: Standard ProductPlan interface + client-specific team management settings (e.g., /settings/team).


3. 
Client User:


	- Authentication: Via Clerk. Belongs to a Clerk Organization.

	- Permissions: Standard CRUD on Products, Ideas, Roadmaps, Issues within their assigned Client, as defined by ProductPlan application logic (e.g., contribute ideas, create features, update issues).

	- UI: Standard ProductPlan interface.


4. 
Client Viewer:


	- Authentication: Via Clerk. Belongs to a Clerk Organization.

	- Permissions: Read-only access to Products, Ideas, Roadmaps, Issues within their assigned Client.

	- UI: Standard ProductPlan interface, with UI elements disabled for write actions.



---

UI/UX with Tailwind CSS & Shadcn UI

1. 


Styling:


	- Tailwind CSS 4: Used for all styling. Configure tailwind.config.ts for custom themes, colors, and components.

	- CSS Variables: Utilize Tailwind's @theme directive with CSS variables for dynamic theming (e.g., light/dark mode, client-specific branding if desired).


2. 
Component Library:


	- Shadcn UI: Adopt Shadcn UI components by copying their code into src/components/ui/. This provides full control and allows for customization without external dependencies.

	- Initial Components: Start with Button, Input, Dialog, Card, Table, DropdownMenu, Select, Form, Toaster, AlertDialog.

	- Integration: Ensure components are correctly configured with Tailwind CSS (e.g., cn utility for clsx and tailwind-merge).


3. 
Theming:


	- Dark Mode: Implement toggle using next-themes (or similar) combined with Tailwind's dark: variant and Shadcn's CSS variables.

	- Branding: Possibility for client-specific branding (e.g., logo, primary color) configured by Client Admin, applied via CSS variables.


4. 
Layout:


	- Responsive design for desktop, tablet, and mobile.

	- Consistent navigation (sidebar, top bar).

	- Clear content areas for each module.



---

Database Schema (Prisma 7)

Key Schema Additions for SaaS & Multi-Tenancy

	// prisma/schema.prisma
	
	// ... (existing generator client and datasource blocks) ...
	
	// ==================== SAAS MULTI-TENANCY ====================
	
	model SuperAdmin {
	  id            String   @id @default(cuid())
	  email         String   @unique
	  passwordHash  String
	  name          String?
	  createdAt     DateTime @default(now())
	  updatedAt     DateTime @updatedAt
	}
	
	model Client {
	  id            String        @id @default(cuid())
	  name          String        @unique
	  slug          String        @unique // For URL paths or subdomains
	  clerkOrgId    String?       @unique // Link to Clerk Organization
	  status        ClientStatus  @default(PENDING_SETUP)
	  
	  // Relations
	  clientUsers   ClientUser[]  // Users associated with this client
	  products      Product[]     // Products owned by this client
	  
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
	  clerkUserId   String          @unique // Link to Clerk User
	  client        Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
	  clientId      String
	  role          ClientUserRole  // Role within the *client's organization*
	  
	  createdAt     DateTime        @default(now())
	  updatedAt     DateTime        @updatedAt
	
	  @@index([clerkUserId])
	  @@index([clientId])
	}
	
	enum ClientUserRole {
	  CLIENT_ADMIN
	  CLIENT_USER
	  CLIENT_VIEWER
	}
	
	
	// ==================== CORE MODULES (UPDATED WITH clientId) ====================
	
	model Product {
	  id          String        @id @default(cuid())
	  name        String
	  description String?
	  vision      String?
	  strategy    String?
	  status      ProductStatus @default(ACTIVE)
	  color       String        @default("#3B82F6")
	  icon        String?
	  
	  // Multi-tenancy link
	  client      Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
	  clientId    String
	  
	  // Relations
	  members     ProductMember[]
	  ideas       Idea[]
	  roadmaps    Roadmap[]
	  issues      Issue[]
	  goals       Goal[]
	  customFields CustomField[]
	  
	  createdAt   DateTime      @default(now())
	  updatedAt   DateTime      @updatedAt
	  
	  @@index([clientId])
	  @@unique([clientId, name]) // Ensure unique product names per client
	}
	
	// ... (Update all other models - Idea, Roadmap, RoadmapItem, Release, Issue, Goal, Comment, Tag, Attachment, CustomField, Notification -
	//      to include a `clientId String` field and a `@relation(fields: [clientId], references: [id], onDelete: Cascade)` to the Client model.
	//      Ensure `clientId` is part of unique constraints where appropriate.)
	//      Example for Idea:
	model Idea {
	  id              String        @id @default(cuid())
	  title           String
	  description     String
	  status          IdeaStatus    @default(SUBMITTED)
	  
	  // Multi-tenancy link
	  client          Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
	  clientId        String
	  
	  // Relations
	  product         Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
	  productId       String
	  authorId        String // Clerk User ID (string)
	  
	  // ... (rest of Idea fields) ...
	  
	  @@index([clientId])
	  @@index([productId])
	  @@index([authorId]) // Consider if a direct relation to ClientUser is better for strictness
	}
	
	// Example for ProductMember:
	model ProductMember {
	  id          String   @id @default(cuid())
	  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
	  productId   String
	  clerkUserId String   // Link to Clerk User
	  role        ProductMemberRole
	  
	  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
	  clientId    String // Inherited from Product for consistency
	  
	  createdAt   DateTime @default(now())
	  
	  @@unique([productId, clerkUserId])
	  @@index([productId])
	  @@index([clerkUserId])
	  @@index([clientId])
	}
	enum ProductMemberRole {
	  LEAD
	  MEMBER
	}
	
	// ... (The rest of the models (Roadmap, RoadmapItem, Release, Issue, Goal, Comment, Tag, Attachment, CustomField, Notification)
	//      will follow a similar pattern, adding `clientId` and `@relation` to Client.)
	//      For `Comment` and `Notification`, `clerkUserId` directly instead of `authorId` referencing local User.

Database Seed Script (Updated)

	// prisma/seed.ts
	import { PrismaClient } from '../src/generated/prisma/client'
	import { hash } from 'argon2' // Using argon2 for better password hashing
	import { randomUUID } from 'crypto'
	
	const prisma = new PrismaClient()
	
	async function main() {
	  console.log('Starting database seeding...')
	
	  // 1. Create a Super Admin
	  const superAdminPassword = await hash('superadmin123')
	  const superAdmin = await prisma.superAdmin.create({
	    data: {
	      email: 'superadmin@productplan.com',
	      name: 'Super Admin',
	      passwordHash: superAdminPassword,
	    },
	  })
	  console.log(`Created Super Admin: ${superAdmin.email}`)
	
	  // 2. Create a Client
	  const clientClerkOrgId = `org_${randomUUID().replace(/-/g, '')}` // Mock Clerk Org ID
	  const client1 = await prisma.client.create({
	    data: {
	      name: 'Acme Corporation',
	      slug: 'acme-corp',
	      clerkOrgId: clientClerkOrgId,
	      status: 'ACTIVE',
	    },
	  })
	  console.log(`Created Client: ${client1.name} (Clerk Org ID: ${client1.clerkOrgId})`)
	
	  // 3. Create a Client Admin (mock Clerk User ID, real Clerk will create these)
	  const clientAdminClerkUserId = `user_${randomUUID().replace(/-/g, '')}`
	  await prisma.clientUser.create({
	    data: {
	      clerkUserId: clientAdminClerkUserId,
	      clientId: client1.id,
	      role: 'CLIENT_ADMIN',
	    },
	  })
	  console.log(`Assigned Client Admin (Clerk User ID: ${clientAdminClerkUserId}) to ${client1.name}`)
	
	  // 4. Create sample product for Client 1
	  const product1 = await prisma.product.create({
	    data: {
	      name: 'ProductPlan Core',
	      description: 'The core product management application itself.',
	      vision: 'Enable product teams to build great products.',
	      strategy: 'Focus on user experience and integration.',
	      status: 'ACTIVE',
	      clientId: client1.id,
	    },
	  })
	  console.log(`Created Product: ${product1.name} for ${client1.name}`)
	
	  // 5. Create sample idea for Product 1, Client 1
	  await prisma.idea.create({
	    data: {
	      title: 'Implement AI for roadmap prediction',
	      description: 'Use AI to suggest optimal roadmap sequences.',
	      productId: product1.id,
	      clientId: client1.id,
	      authorId: clientAdminClerkUserId, // Linked to a Clerk User
	      status: 'UNDER_REVIEW',
	      riceReach: 9,
	      riceImpact: 3,
	      riceConfidence: 0.7,
	      riceEffort: 5,
	      riceScore: (9 * 3 * 0.7) / 5,
	    },
	  })
	  console.log('Created sample idea.')
	
	  // ... (add more seeded data for other modules, ensuring clientId is always set)
	
	  console.log('✅ Database seeding complete.')
	}
	
	main()
	  .catch((e) => {
	    console.error('❌ Database seeding failed:', e)
	    process.exit(1)
	  })
	  .finally(async () => {
	    await prisma.$disconnect()
	  })


---

Frontend Architecture

Project Structure (Updated for Bun & Shadcn)

	src/
	├── app/
	│   ├── App.tsx
	│   ├── main.tsx
	│   ├── routeTree.gen.ts # Generated by TanStack Router
	│   └── router.tsx
	├── routes/
	│   ├── __root.tsx
	│   ├── _auth/                           # Clerk auth routes
	│   │   ├── sign-in.tsx
	│   │   ├── sign-up.tsx
	│   │   └── sso-callback.tsx
	│   ├── _authenticated/                  # Protected routes for logged-in users
	│   │   ├── layout.tsx
	│   │   ├── index.tsx
	│   │   ├── clients/                     # Super Admin client management
	│   │   │   ├── index.tsx
	│   │   │   └── $clientId/
	│   │   │       ├── index.tsx
	│   │   │       └── users.tsx           # Client user management (Super Admin view)
	│   │   ├── $clientSlug/                 # Dynamic client-specific routes
	│   │   │   ├── layout.tsx              # Layout for client dashboard
	│   │   │   ├── index.tsx
	│   │   │   ├── products/
	│   │   │   │   ├── index.tsx
	│   │   │   │   ├── new.tsx
	│   │   │   │   └── $productId/
	│   │   │   │       ├── index.tsx
	│   │   │   │       ├── ideas.tsx
	│   │   │   │       ├── roadmap.tsx
	│   │   │   │       └── issues.tsx
	│   │   │   └── settings/
	│   │   │       ├── index.tsx
	│   │   │       └── team.tsx           # Client Admin user management (Clerk Organizations)
	│   │   ├── global-ideas.tsx             # Maybe a public or global ideas portal
	│   │   └── user-profile.tsx
	├── components/
	│   ├── ui/                              # Shadcn UI components (copied)
	│   ├── auth/                            # Clerk-specific components/wrappers
	│   │   ├── ClerkProviderWithRouter.tsx
	│   │   ├── SignInButton.tsx
	│   │   └── UserButton.tsx
	│   ├── layouts/
	│   │   ├── RootLayout.tsx
	│   │   ├── AuthenticatedLayout.tsx
	│   │   ├── ClientLayout.tsx
	│   │   └── SuperAdminLayout.tsx
	│   ├── common/                          # Reusable app-specific components
	│   │   ├── Header.tsx
	│   │   ├── Sidebar.tsx
	│   │   ├── ThemeToggle.tsx
	│   │   └── LoadingSpinner.tsx
	│   ├── products/
	│   ├── ideas/
	│   ├── roadmap/
	│   ├── issues/
	│   └── super-admin/                     # Super Admin specific components
	│       ├── ClientTable.tsx
	│       ├── ClientForm.tsx
	│       └── SuperAdminDashboard.tsx
	├── hooks/
	│   ├── useClerkAuth.ts                  # Clerk user/org info
	│   ├── useClientContext.ts              # Provides active clientId/slug
	│   ├── useProducts.ts
	│   └── usePermissions.ts                # Custom hook for role-based permissions
	├── lib/
	│   ├── api.ts
	│   ├── queryClient.ts
	│   ├── utils.ts                         # Includes `cn` utility
	│   ├── config.ts                        # Centralized client configuration
	│   └── tenants.ts                       # Helper for multi-tenancy context
	├── styles/
	│   ├── globals.css                      # Tailwind base styles, Shadcn theming
	│   └── variables.css
	└── types/
	    ├── global.d.ts
	    ├── client.ts
	    ├── product.ts
	    └── idea.ts

Key Implementation Details (Frontend)

1. Tailwind CSS and Shadcn UI Setup

1. Initialize Tailwind CSS:

	bun add -D tailwindcss@next postcss autoprefixer
	npx tailwindcss init -t ts



2. Configure tailwind.config.ts:

	// tailwind.config.ts
	import type { Config } from 'tailwindcss'
	import { fontFamily } from 'tailwindcss/defaultTheme'
	import animate from 'tailwindcss-animate' // Or tw-animate-css as per shadcn docs
	
	const config = {
	  darkMode: ['class'],
	  content: [
	    './pages/**/*.{ts,tsx}',
	    './components/**/*.{ts,tsx}',
	    './app/**/*.{ts,tsx}',
	    './src/**/*.{ts,tsx}',
	  ],
	  prefix: '',
	  theme: {
	    container: {
	      center: true,
	      padding: '2rem',
	      screens: {
	        '2xl': '1400px',
	      },
	    },
	    extend: {
	      colors: {
	        border: 'hsl(var(--border))',
	        input: 'hsl(var(--input))',
	        ring: 'hsl(var(--ring))',
	        background: 'hsl(var(--background))',
	        foreground: 'hsl(var(--foreground))',
	        primary: {
	          DEFAULT: 'hsl(var(--primary))',
	          foreground: 'hsl(var(--primary-foreground))',
	        },
	        secondary: {
	          DEFAULT: 'hsl(var(--secondary))',
	          foreground: 'hsl(var(--secondary-foreground))',
	        },
	        destructive: {
	          DEFAULT: 'hsl(var(--destructive))',
	          foreground: 'hsl(var(--destructive-foreground))',
	        },
	        muted: {
	          DEFAULT: 'hsl(var(--muted))',
	          foreground: 'hsl(var(--muted-foreground))',
	        },
	        accent: {
	          DEFAULT: 'hsl(var(--accent))',
	          foreground: 'hsl(var(--accent-foreground))',
	        },
	        popover: {
	          DEFAULT: 'hsl(var(--popover))',
	          foreground: 'hsl(var(--popover-foreground))',
	        },
	        card: {
	          DEFAULT: 'hsl(var(--card))',
	          foreground: 'hsl(var(--card-foreground))',
	        },
	      },
	      borderRadius: {
	        lg: `var(--radius)`,
	        md: `calc(var(--radius) - 2px)`,
	        sm: `calc(var(--radius) - 4px)`,
	      },
	      fontFamily: {
	        sans: ['var(--font-sans)', ...fontFamily.sans],
	      },
	      keyframes: {
	        'accordion-down': {
	          from: { height: '0' },
	          to: { height: 'var(--radix-accordion-content-height)' },
	        },
	        'accordion-up': {
	          from: { height: 'var(--radix-accordion-content-height)' },
	          to: { height: '0' },
	        },
	      },
	      animation: {
	        'accordion-down': 'accordion-down 0.2s ease-out',
	        'accordion-up': 'accordion-up 0.2s ease-out',
	      },
	    },
	  },
	  plugins: [animate],
	} satisfies Config
	
	export default config



3. Add globals.css:

	/* src/styles/globals.css */
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
	
	@layer base {
	  :root {
	    --background: 0 0% 100%;
	    --foreground: 222.2 47.4% 11.2%;
	    --muted: 210 40% 96.1%;
	    --muted-foreground: 215.4 16.3% 46.9%;
	    --popover: 0 0% 100%;
	    --popover-foreground: 222.2 47.4% 11.2%;
	    --border: 214.3 31.8% 91.4%;
	    --input: 214.3 31.8% 91.4%;
	    --card: 0 0% 100%;
	    --card-foreground: 222.2 47.4% 11.2%;
	    --primary: 222.2 47.4% 11.2%;
	    --primary-foreground: 210 40% 98%;
	    --secondary: 210 40% 96.1%;
	    --secondary-foreground: 222.2 47.4% 11.2%;
	    --accent: 210 40% 96.1%;
	    --accent-foreground: 222.2 47.4% 11.2%;
	    --destructive: 0 84.2% 60.2%;
	    --destructive-foreground: 210 40% 98%;
	    --ring: 215 20.4% 69.8%;
	    --radius: 0.5rem;
	  }
	
	  .dark {
	    --background: 222.2 47.4% 11.2%;
	    --foreground: 210 40% 98%;
	    --muted: 217.2 32.6% 17.5%;
	    --muted-foreground: 215 20.4% 69.8%;
	    --popover: 222.2 47.4% 11.2%;
	    --popover-foreground: 210 40% 98%;
	    --border: 217.2 32.6% 17.5%;
	    --input: 217.2 32.6% 17.5%;
	    --card: 222.2 47.4% 11.2%;
	    --card-foreground: 210 40% 98%;
	    --primary: 210 40% 98%;
	    --primary-foreground: 222.2 47.4% 11.2%;
	    --secondary: 217.2 32.6% 17.5%;
	    --secondary-foreground: 210 40% 98%;
	    --accent: 217.2 32.6% 17.5%;
	    --accent-foreground: 210 40% 98%;
	    --destructive: 0 62.8% 30.6%;
	    --destructive-foreground: 210 40% 98%;
	    --ring: 217.2 32.6% 17.5%;
	  }
	}
	
	@layer base {
	  * {
	    @apply border-border;
	  }
	  body {
	    @apply bg-background text-foreground;
	  }
	}



4. Install Shadcn UI:

	# (Using Bun for this)
	bunx shadcn-ui@latest init


	- Configure to use Tailwind CSS, TypeScript, src/components/ui.

	- Choose New York style and appropriate base color.


5. Add Shadcn Components:

	bunx shadcn-ui@latest add button input dialog card table dropdown-menu select form toast alert-dialog


	- Continue adding components as needed per module.


2. Clerk Frontend Integration

	// src/components/auth/ClerkProviderWithRouter.tsx
	import { ClerkProvider, useAuth } from '@clerk/clerk-react'
	import { Outlet, redirect, useRouterState } from '@tanstack/react-router'
	import { queryClient } from '../../lib/queryClient' // Assuming you have this
	import { QueryClientProvider } from '@tanstack/react-query'
	
	const ClerkLayout = () => {
	  const { isLoaded, isSignedIn } = useAuth()
	  const routerState = useRouterState()
	
	  if (!isLoaded) {
	    return <div>Loading authentication...</div> // Or a proper spinner
	  }
	
	  // Handle redirects based on auth state and current route
	  if (
	    !isSignedIn &&
	    routerState.location.pathname !== '/auth/sign-in' &&
	    routerState.location.pathname !== '/auth/sign-up'
	  ) {
	    throw redirect({ to: '/auth/sign-in' })
	  } else if (isSignedIn && routerState.location.pathname === '/auth/sign-in') {
	    throw redirect({ to: '/products' }) // Redirect to default authenticated page
	  }
	
	  return <Outlet />
	}
	
	export function ClerkProviderWithRouter({
	  children,
	}: {
	  children: React.ReactNode
	}) {
	  return (
	    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
	      <QueryClientProvider client={queryClient}>
	        <ClerkLayout>{children}</ClerkLayout>
	      </QueryClientProvider>
	    </ClerkProvider>
	  )
	}


	// src/app/main.tsx
	import React from 'react'
	import ReactDOM from 'react-dom/client'
	import { RouterProvider } from '@tanstack/react-router'
	import { router } from './router'
	import { ClerkProviderWithRouter } from './components/auth/ClerkProviderWithRouter'
	import '../styles/globals.css' // Tailwind/Shadcn styles
	
	ReactDOM.createRoot(document.getElementById('root')!).render(
	  <React.StrictMode>
	    <ClerkProviderWithRouter>
	      <RouterProvider router={router} />
	    </ClerkProviderWithRouter>
	  </React.StrictMode>
	)

3. Tenant Context

	// src/hooks/useClientContext.ts
	import { createContext, useContext } from 'react'
	import { useOrganization } from '@clerk/clerk-react'
	import { api } from '../lib/api' // Your API client
	import { useQuery } from '@tanstack/react-query'
	import type { Client } from '../types/client' // Your Client type
	
	interface ClientContextType {
	  client: Client | undefined
	  isLoading: boolean
	  isSuperAdmin: boolean
	  isAdminOfClient: boolean // Clerk Org Admin for the current client
	  isMemberOfClient: boolean // Clerk Org Member for the current client
	  clientUserRole: 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_VIEWER' | undefined
	  activeClientSlug: string | undefined
	}
	
	const ClientContext = createContext<ClientContextType | undefined>(undefined)
	
	export function ClientProvider({ children }: { children: React.ReactNode }) {
	  const { organization, isLoaded: isOrgLoaded, membership } = useOrganization()
	  const activeClientSlug =
	    (organization?.slug as string) ||
	    'super-admin' // Fallback for super-admin route, or specific client ID if not slug-based
	
	  // Fetch Client data from your backend based on Clerk Org ID or slug
	  const { data: client, isLoading: isClientLoading } = useQuery<Client>({
	    queryKey: ['client', activeClientSlug],
	    queryFn: async () => {
	      // Logic to fetch client by slug or clerkOrgId
	      if (activeClientSlug === 'super-admin') return undefined // Super admin doesn't have a direct "client"
	      const res = await api.get(`/clients/slug/${activeClientSlug}`)
	      return res.data
	    },
	    enabled: isOrgLoaded && !!activeClientSlug,
	  })
	
	  // Determine user role within the *current client*
	  const clientUserRole: ClientUserRole | undefined =
	    membership?.role === 'org:admin'
	      ? 'CLIENT_ADMIN'
	      : membership?.role === 'org:member'
	        ? 'CLIENT_USER'
	        : undefined // Default for standard members, add specific roles from Clerk for 'CLIENT_VIEWER'
	
	  const isSuperAdmin = !organization && activeClientSlug === 'super-admin' // Simplistic check, enhance with actual super admin auth
	  const isAdminOfClient = clientUserRole === 'CLIENT_ADMIN'
	  const isMemberOfClient =
	    clientUserRole === 'CLIENT_USER' || clientUserRole === 'CLIENT_ADMIN'
	
	  const value = {
	    client,
	    isLoading: isOrgLoaded || isClientLoading,
	    isSuperAdmin,
	    isAdminOfClient,
	    isMemberOfClient,
	    clientUserRole,
	    activeClientSlug,
	  }
	
	  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
	}
	
	export function useClientContext() {
	  const context = useContext(ClientContext)
	  if (context === undefined) {
	    throw new Error('useClientContext must be used within a ClientProvider')
	  }
	  return context
	}

4. Multi-tenant Routing (TanStack Router)

	// src/routes/_authenticated/$clientSlug/layout.tsx
	import { Outlet, createFileRoute } from '@tanstack/react-router'
	import { ClientProvider, useClientContext } from '../../../hooks/useClientContext'
	import ClientNavbar from '../../../components/layouts/ClientNavbar' // Custom client-specific navbar
	
	export const Route = createFileRoute('/_authenticated/$clientSlug/layout')({
	  component: () => (
	    <ClientProvider>
	      <ClientLayoutWrapper />
	    </ClientProvider>
	  ),
	  beforeLoad: ({ params }) => {
	    // Optional: Pre-fetch client data or validate client slug here
	    if (params.clientSlug === 'super-admin') {
	      // Handle super-admin specific routing outside regular client flow
	      // Or redirect if user is not a super admin
	      return
	    }
	    // For regular clients, ensure a valid client slug
	  },
	})
	
	function ClientLayoutWrapper() {
	  const { client, isLoading, isSuperAdmin, activeClientSlug } = useClientContext()
	
	  if (isLoading) {
	    return <div>Loading client context...</div> // Shadcn Spinner component
	  }
	
	  if (activeClientSlug === 'super-admin' && isSuperAdmin) {
	    return <Outlet /> // Render Super Admin specific routes
	  }
	
	  if (!client) {
	    return <div>Client not found or access denied.</div> // Shadcn Alert/Callout
	  }
	
	  return (
	    <div className="flex h-screen">
	      <ClientNavbar client={client} /> {/* Client-specific navigation */}
	      <main className="flex-1 overflow-auto p-4 md:p-6">
	        <Outlet />
	      </main>
	    </div>
	  )
	}


---

Backend Architecture

Server Runtime

- Bun: Directly runs TypeScript files (.ts or .mts). No separate build step for backend.

Project Structure (Backend)

	server/
	├── src/
	│   ├── index.ts                      # Bun server entry (e.g., Fastify)
	│   ├── plugins/                      # Fastify plugins (e.g., Clerk webhook)
	│   │   ├── clerk-webhook.ts
	│   │   └── auth-middleware.ts        # Clerk middleware
	│   ├── routes/
	│   │   ├── super-admin.routes.ts     # Client CRUD by Super Admin
	│   │   ├── client-admin.routes.ts    # Client Admin specific operations
	│   │   ├── products.routes.ts        # (Updated for clientId scope)
	│   │   ├── ideas.routes.ts           # (Updated for clientId scope)
	│   │   └── ...
	│   ├── services/
	│   │   ├── client.service.ts         # Logic for Client CRUD (Super Admin)
	│   │   ├── product.service.ts        # (Updated for clientId scope)
	│   │   ├── idea.service.ts           # (Updated for clientId scope)
	│   │   └── ai.service.ts
	│   ├── middleware/
	│   │   ├── clerk-webhook-verify.ts   # Verify Clerk webhooks
	│   │   ├── tenant-scope.ts           # Enforces clientId scoping
	│   │   ├── super-admin-only.ts       # Authorization for Super Admin
	│   │   └── client-admin-only.ts      # Authorization for Client Admin
	│   ├── schemas/                      # Zod schemas
	│   │   ├── client.schema.ts
	│   │   └── product.schema.ts
	│   ├── utils/
	│   │   ├── errors.ts
	│   │   └── response.ts
	│   └── prisma/
	│       └── client.ts
	└── prisma/
	    └── client.ts

Key Implementation Details (Backend)

1. Bun Server Setup (Fastify example)

	// server/src/index.ts
	import Fastify from 'fastify'
	import cors from '@fastify/cors'
	import helmet from '@fastify/helmet'
	import morgan from 'morgan' // Can be replaced by fastify-plugin for better integration
	import { config } from 'dotenv' // Use 'dotenv/config' in bun run command
	import { prisma } from './prisma/client'
	import { clerkWebhookPlugin } from './plugins/clerk-webhook'
	import { authenticateClerk } from './plugins/auth-middleware'
	
	config() // Load environment variables
	
	const fastify = Fastify({
	  logger: true,
	})
	
	// Register plugins
	await fastify.register(cors)
	await fastify.register(helmet)
	await fastify.register(clerkWebhookPlugin)
	
	// Authentication middleware (for non-webhook routes)
	fastify.addHook('onRequest', authenticateClerk) // Ensure user is authenticated via Clerk
	
	// Register routes
	// fastify.register(superAdminRoutes, { prefix: '/api/super-admin' })
	// fastify.register(clientAdminRoutes, { prefix: '/api/client-admin' })
	// fastify.register(productRoutes, { prefix: '/api/clients/:clientId/products' }) // Example of tenant scoping
	
	const PORT = parseInt(process.env.PORT || '3001', 10)
	
	try {
	  await fastify.listen({ port: PORT, host: '0.0.0.0' })
	  console.log(`🚀 ProductPlan API running on http://localhost:${PORT}`)
	} catch (err) {
	  fastify.log.error(err)
	  await prisma.$disconnect()
	  process.exit(1)
	}
	
	// Graceful shutdown
	process.on('SIGTERM', async () => {
	  fastify.log.info('SIGTERM received, shutting down gracefully')
	  await fastify.close()
	  await prisma.$disconnect()
	  process.exit(0)
	})

2. Clerk Webhook Handling

	// server/src/plugins/clerk-webhook.ts
	import { FastifyPluginAsync } from 'fastify'
	import { WebhookEvent } from '@clerk/clerk-sdk-node'
	import { Webhook } from 'svix'
	import { prisma } from '../prisma/client'
	
	const svixWebhookSecret = process.env.CLERK_WEBHOOK_SECRET!
	
	export const clerkWebhookPlugin: FastifyPluginAsync = async (fastify) => {
	  fastify.post('/api/webhooks/clerk', async (request, reply) => {
	    const headers = request.headers
	    const payload = JSON.stringify(request.body)
	
	    // Verify webhook signature
	    const svix_id = headers['svix-id'] as string
	    const svix_timestamp = headers['svix-timestamp'] as string
	    const svix_signature = headers['svix-signature'] as string
	
	    if (!svix_id || !svix_timestamp || !svix_signature) {
	      reply.status(400).send('Error: No Svix headers')
	      return
	    }
	
	    const wh = new Webhook(svixWebhookSecret)
	    let event: WebhookEvent
	    try {
	      event = wh.verify(payload, {
	        'svix-id': svix_id,
	        'svix-timestamp': svix_timestamp,
	        'svix-signature': svix_signature,
	      }) as WebhookEvent
	    } catch (err) {
	      fastify.log.error('Webhook verification failed', err)
	      reply.status(400).send('Error: Webhook verification failed')
	      return
	    }
	
	    // Handle event types
	    switch (event.type) {
	      case 'organization.created':
	        await prisma.client.create({
	          data: {
	            clerkOrgId: event.data.id,
	            name: event.data.name,
	            slug: event.data.slug || event.data.name.toLowerCase().replace(/\s/g, '-'),
	            status: 'PENDING_SETUP', // Or ACTIVE, depending on your onboarding flow
	          },
	        })
	        break
	      case 'organization.updated':
	        await prisma.client.update({
	          where: { clerkOrgId: event.data.id },
	          data: {
	            name: event.data.name,
	            slug: event.data.slug || event.data.name.toLowerCase().replace(/\s/g, '-'),
	          },
	        })
	        break
	      case 'organization.deleted':
	        await prisma.client.update({
	          where: { clerkOrgId: event.data.id },
	          data: { status: 'INACTIVE' }, // Soft delete or actual delete
	        })
	        break
	      case 'organizationMembership.created':
	        // Link Clerk user to Client in our DB
	        await prisma.clientUser.create({
	          data: {
	            clerkUserId: event.data.public_user_data.user_id,
	            clientId: (
	              await prisma.client.findUniqueOrThrow({
	                where: { clerkOrgId: event.data.organization.id },
	              })
	            ).id,
	            role:
	              event.data.role === 'org:admin' ? 'CLIENT_ADMIN' : 'CLIENT_USER', // Adjust for CLIENT_VIEWER if Clerk provides different role
	          },
	        })
	        break
	      case 'organizationMembership.updated':
	        // Update user's role in our DB
	        const client = await prisma.client.findUniqueOrThrow({
	          where: { clerkOrgId: event.data.organization.id },
	        })
	        await prisma.clientUser.update({
	          where: {
	            clerkUserId_clientId: {
	              clerkUserId: event.data.public_user_data.user_id,
	              clientId: client.id,
	            },
	          },
	          data: {
	            role:
	              event.data.role === 'org:admin' ? 'CLIENT_ADMIN' : 'CLIENT_USER',
	          },
	        })
	        break
	      case 'organizationMembership.deleted':
	        // Remove user's association with client
	        const deletedClient = await prisma.client.findUniqueOrThrow({
	          where: { clerkOrgId: event.data.organization.id },
	        })
	        await prisma.clientUser.delete({
	          where: {
	            clerkUserId_clientId: {
	              clerkUserId: event.data.public_user_data.user_id,
	              clientId: deletedClient.id,
	            },
	          },
	        })
	        break
	      // Handle other Clerk webhook events as needed (e.g., user.created, user.deleted)
	    }
	
	    reply.status(200).send('Webhook received and processed')
	  })
	}

3. Authentication Middleware (Backend)

	// server/src/plugins/auth-middleware.ts
	import { FastifyReply, FastifyRequest, FastifyPluginAsync } from 'fastify'
	import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
	import { AppError } from '../utils/errors'
	
	declare module 'fastify' {
	  interface FastifyRequest {
	    auth?: ClerkExpressWithAuth['AuthObject'] & {
	      clientId?: string
	      clientUserRole?: 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_VIEWER'
	    }
	  }
	}
	
	export const authenticateClerk: FastifyPluginAsync = async (fastify) => {
	  fastify.addHook('onRequest', async (request, reply) => {
	    if (request.url.startsWith('/api/webhooks/clerk')) {
	      return // Skip auth for webhooks, handled by Svix
	    }
	
	    try {
	      const authMiddleware = ClerkExpressWithAuth({
	        publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
	        secretKey: process.env.CLERK_SECRET_KEY,
	      })
	      
	      // ClerkExpressWithAuth expects Node.js Req/Res objects.
	      // We need to wrap Fastify's Request/Reply to be compatible.
	      // This is a simplified wrapper; a full solution might need custom adapters.
	      const nodeReq: any = {
	        headers: request.headers,
	        url: request.url,
	        method: request.method,
	      }
	      const nodeRes: any = {
	        end: () => reply.send(),
	        setHeader: (key: string, value: string) => reply.header(key, value),
	        finished: false, // Simulate for Clerk
	      }
	
	      await new Promise<void>((resolve, reject) => {
	        authMiddleware(nodeReq, nodeRes, (err?: any) => {
	          if (err) return reject(err)
	          request.auth = nodeReq.auth // Attach Clerk auth object
	          resolve()
	        })
	      })
	
	      if (!request.auth?.userId) {
	        throw new AppError('Unauthorized: Not authenticated', 401)
	      }
	
	      // Populate clientId and clientUserRole based on Clerk Organization
	      if (request.auth.orgId) {
	        const client = await prisma.client.findUnique({
	          where: { clerkOrgId: request.auth.orgId },
	          select: { id: true },
	        })
	
	        if (!client) {
	          throw new AppError('Unauthorized: Client not found for organization', 403)
	        }
	        request.auth.clientId = client.id
	
	        // Fetch our internal ClientUserRole
	        const clientUser = await prisma.clientUser.findUnique({
	          where: {
	            clerkUserId_clientId: {
	              clerkUserId: request.auth.userId,
	              clientId: client.id,
	            },
	          },
	          select: { role: true },
	        })
	        request.auth.clientUserRole = clientUser?.role
	      } else {
	        // Handle users not in an organization (e.g., trying to access super-admin or public resources)
	        // If no orgId, ensure they aren't trying to access client-specific data
	        if (!request.url.startsWith('/api/super-admin')) {
	          // If not super-admin, this user likely shouldn't be accessing
	          // client-specific data. Could redirect or throw error.
	          // For now, allow and tenantScope will handle.
	        }
	      }
	    } catch (error) {
	      if (error instanceof AppError) {
	        reply.status(error.statusCode).send({ message: error.message, details: error.details })
	      } else {
	        reply.status(500).send({ message: 'Internal server error during authentication' })
	      }
	    }
	  })
	}

4. Tenant Scoping Middleware

	// server/src/middleware/tenant-scope.ts
	import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'
	import { AppError } from '../utils/errors'
	
	export function tenantScope(
	  request: FastifyRequest,
	  reply: FastifyReply,
	  done: HookHandlerDoneFunction
	) {
	  const { auth } = request
	
	  // For routes that don't need tenant scoping (e.g., super-admin routes, auth routes)
	  // or if the route is /api/super-admin, skip this middleware.
	  if (request.routerPath?.startsWith('/api/super-admin')) {
	    done()
	    return
	  }
	
	  // Ensure an authenticated user is associated with a client
	  if (!auth?.userId || !auth.clientId) {
	    done(
	      new AppError(
	        'Access denied: User not associated with a client organization.',
	        403
	      )
	    )
	    return
	  }
	
	  // Ensure the clientId from the URL matches the user's active client
	  const routeClientId = (request.params as { clientId?: string }).clientId
	
	  if (routeClientId && routeClientId !== auth.clientId) {
	    done(
	      new AppError(
	        'Access denied: Client ID mismatch in URL and user context.',
	        403
	      )
	    )
	    return
	  }
	
	  // Attach clientId to request for downstream services/controllers
	  request.params = { ...request.params, clientId: auth.clientId }
	  done()
	}

5. Super Admin Authorization Middleware

	// server/src/middleware/super-admin-only.ts
	import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'
	import { AppError } from '../utils/errors'
	import { prisma } from '../prisma/client'
	import { hash, verify } from 'argon2' // Using argon2
	
	// This is a simplified example. A real super-admin might have a dedicated login form.
	export async function superAdminOnly(
	  request: FastifyRequest,
	  reply: FastifyReply,
	  done: HookHandlerDoneFunction
	) {
	  // Option 1: Basic auth from header
	  const authHeader = request.headers.authorization
	  if (!authHeader || !authHeader.startsWith('Basic ')) {
	    reply.header('WWW-Authenticate', 'Basic realm="Super Admin Access"')
	    return done(new AppError('Unauthorized: Super Admin credentials required', 401))
	  }
	
	  const encoded = authHeader.split(' ')[1]
	  const decoded = Buffer.from(encoded, 'base64').toString('utf8')
	  const [email, password] = decoded.split(':')
	
	  if (!email || !password) {
	    return done(new AppError('Unauthorized: Invalid Super Admin credentials format', 401))
	  }
	
	  try {
	    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } })
	    if (!superAdmin || !(await verify(superAdmin.passwordHash, password))) {
	      return done(new AppError('Unauthorized: Invalid Super Admin credentials', 401))
	    }
	    // Attach superAdmin to request for controllers if needed
	    request.superAdmin = superAdmin // Add to FastifyRequest declaration
	    done()
	  } catch (error) {
	    request.log.error(error)
	    done(new AppError('Internal server error during Super Admin authentication', 500))
	  }
	}


---

Testing Strategy

Playwright Configuration (Updated for Bun)

	// playwright.config.ts
	import { defineConfig, devices } from '@playwright/test'
	
	export default defineConfig({
	  testDir: './tests/e2e',
	  fullyParallel: true,
	  forbidOnly: !!process.env.CI,
	  retries: process.env.CI ? 2 : 0,
	  workers: process.env.CI ? 1 : undefined,
	  reporter: [
	    ['html'],
	    ['json', { outputFile: 'test-results.json' }],
	    ['junit', { outputFile: 'test-results.xml' }],
	  ],
	  use: {
	    baseURL: 'http://localhost:3000',
	    trace: 'on-first-retry',
	    screenshot: 'only-on-failure',
	    video: 'retain-on-failure',
	  },
	
	  projects: [
	    {
	      name: 'chromium',
	      use: { ...devices['Desktop Chrome'] },
	    },
	    {
	      name: 'firefox',
	      use: { ...devices['Desktop Firefox'] },
	    },
	    {
	      name: 'webkit',
	      use: { ...devices['Desktop Safari'] },
	    },
	    {
	      name: 'Mobile Chrome',
	      use: { ...devices['Pixel 5'] },
	    },
	  ],
	
	  webServer: {
	    command: 'bun run dev', // Use bun to start frontend dev server
	    url: 'http://localhost:3000',
	    reuseExistingServer: !process.env.CI,
	    timeout: 120000,
	  },
	})

Test Cases (Updated for SaaS & Clerk)

- Authentication (Clerk):
	- User sign-up, sign-in, sign-out via Clerk UI.

	- Organization selection/creation.

	- Accessing client data only after selecting an organization.

	- Unauthorized access attempts to protected routes.


- Super Admin Portal:
	- Super Admin login.

	- Create/manage clients.

	- View client details.

	- Attempt to access client-specific product data (should fail).


- Client Admin Functions:
	- Client Admin logs in, selects their organization.

	- Manage their team members (invite, remove, change role) using Clerk's embedded components.

	- Full CRUD on Products, Ideas, Roadmaps, Issues within their client's context.

	- Attempt to access data from another client (should fail).


- Client User Functions:
	- Client User logs in, accesses their organization.

	- Perform allowed product management tasks (e.g., create idea, update feature).

	- Attempt disallowed actions (e.g., delete product if only user role, access another client's data).


- Data Segregation:
	- Verify that listing products/ideas/roadmaps/issues only shows data belonging to the active client.

	- Ensure that an authenticated user for Client A cannot fetch or modify data belonging to Client B.


- UI Components:
	- Test that Shadcn UI components render correctly and are accessible.

	- Test dark mode toggle.



---

Development Phases

Phase 0: Project Setup & SaaS Foundation (Week 1-2)


Tasks:


-  Initialize Git repository (ProductPlan)

-  Create docs folder structure and initial docs/plans/*.md files

-  Setup Bun runtime for frontend & backend

-  Setup React 19 + TypeScript 5.7.3

-  Configure Prisma 7 (prisma.config.ts) with Client and ClientUser models

-  Implement initial SuperAdmin model and a seed script for a super admin user

-  Setup Tailwind CSS 4 & Shadcn UI (bunx shadcn-ui@latest init and adding base components)

-  Configure @clerk/clerk-react and @clerk/clerk-sdk-node

-  Implement Clerk webhook handler on backend to sync Client and ClientUser records

-  Create basic Clerk authentication pages (/auth/sign-in, /auth/sign-up)

-  Setup Playwright for e2e testing

-  Implement core multi-tenancy middleware (client scoping)

-  Initial CI/CD pipeline scaffolding with Bun commands

Deliverables:


- Complete, documented repository structure

- Working dev environment with Bun, React, Tailwind, Shadcn, Prisma, Clerk

- Basic multi-tenancy database models & synchronization via Clerk webhooks

- Functional Clerk authentication flow

- Playwright tests for auth and basic client creation (by Super Admin)

Definition of Done:


- All core docs files created and reviewed.

- bun install, bun run dev, bun run server:dev work without errors.

- Database migrations run successfully with Client and ClientUser models.

- A Super Admin can be created/accessed.

- Clerk authentication is functional, and Organization creation triggers Client creation via webhook.

- Basic Shadcn component renders are verified.


---

Phase 1: Super Admin & Client Management (Weeks 3-4)


Tasks:


-  Develop Super Admin login/dashboard

-  Implement API routes for Client CRUD (only accessible by Super Admin)

-  Build UI for Client listing, creation, editing, and status management using Shadcn components

-  Integrate Client provisioning/deprovisioning with Clerk Organization management SDK (backend calls)

-  Implement Playwright tests for Super Admin functionalities

Deliverables:


- Fully functional Super Admin portal.

- Robust client management features.

- Comprehensive API documentation for super-admin routes.

Documentation Updates:


-  Detail Super Admin roles and processes in /docs/plans/saas-multi-tenancy.md.

-  Document Super Admin API endpoints in /docs/api/clients-api.md.


---

Phase 2: Client Admin & Team Management (Weeks 5-6)


Tasks:


-  Implement Client Admin dashboard and user management section.

-  Integrate Clerk's embedded components for inviting/removing team members within a client's organization.

-  Map Clerk Organization roles (org:admin, org:member) to ClientUserRole (CLIENT_ADMIN, CLIENT_USER, CLIENT_VIEWER).

-  Develop UI for Client Admins to manage roles of their team members.

-  Implement permissions checks using usePermissions hook on the frontend based on ClientUserRole.

-  Backend authorization middleware for CLIENT_ADMIN actions.

-  Playwright tests for client admin and team management.

Deliverables:


- Client-specific team management (user invites, role changes).

- Granular RBAC for client teams.

Documentation Updates:


-  Update /docs/plans/auth-clerk.md with detailed role mappings.

-  Update /docs/plans/saas-multi-tenancy.md with client admin responsibilities.


---

Phase 3: Products Module (Weeks 7-8)


Tasks:


-  Product CRUD operations (scoped by clientId).

-  Product list with TanStack Table and Shadcn table components.

-  Product detail page.

-  Product dashboard (scoped by clientId).

-  Client Admin/User permissions for product management.

-  Playwright tests for product flows (ensuring client isolation).

Deliverables:


- Fully functional Products module, respecting multi-tenancy.

- Robust UI with Shadcn components.

Documentation Updates:


-  Update /docs/plans/products-module.md with SaaS context.


---

Phase 4: Ideas Module (Weeks 9-10)


Tasks:


-  Idea submission form (scoped by clientId).

-  Idea list with filtering/sorting.

-  Voting/comment system.

-  RICE score calculator.

-  AI duplicate detection (mock/integrate basic service).

-  Idea detail page.

-  Permissions for idea contribution/management.

-  Playwright tests for idea workflows (client isolation).

Deliverables:


- Complete Ideas portal for each client.

Documentation Updates:


-  Complete /docs/plans/ideas-module.md with SaaS context.


---

Phase 5: Roadmap Module - Part 1 (Weeks 11-12)


Tasks:


-  Roadmap CRUD operations (scoped by clientId).

-  Roadmap item management.

-  Timeline/Gantt view with Shadcn components.

-  List view.

-  Release management.

-  Basic dependency tracking.

-  Playwright tests for roadmap creation (client isolation).

Deliverables:


- Core roadmap planning interface, tenant-aware.

Documentation Updates:


-  Update /docs/plans/roadmap-module.md.


---

Phase 6: Roadmap Module - Part 2 (Week 13)


Tasks:


-  Kanban board view with Shadcn's drag-and-drop solutions (or Dnd Kit).

-  Dependency graph visualization.

-  Progress tracking.

-  Capacity planning.

-  Link ideas to roadmap items.

-  Advanced permissions for roadmap editing.

-  Playwright tests for advanced roadmap features.

Deliverables:


- Complete interactive Roadmap module.

Documentation Updates:


-  Finalize roadmap documentation.


---

Phase 7: Known Issues Module (Weeks 14-15)


Tasks:


-  Issue CRUD operations (scoped by clientId).

-  Issue list with filters.

-  Issue detail page.

-  Customer impact tracking.

-  Link issues to roadmap features.

-  Permissions for issue management.

-  Playwright tests for issues (client isolation).

Deliverables:


- Complete Issue tracking system for each client.

Documentation Updates:


-  Complete /docs/plans/issues-module.md.


---

Phase 8: Advanced Features, AI & Polish (Weeks 16-18)


Tasks:


-  Real AI integration for duplicate detection & idea clustering (scoped per client).

-  Sentiment analysis for ideas (per client).

-  Auto-generated release notes (per client).

-  Advanced reporting dashboard (per client).

-  Export functionality (PDF, CSV).

-  Notifications system.

-  Full UI/UX refinement using Shadcn theming.

-  Accessibility audit.

-  Performance optimization with Bun's capabilities.

-  Full Playwright regression suite.

-  Security audit focusing on multi-tenancy and Clerk integration.

-  Final documentation review.

Deliverables:


- Production-ready application with AI features.

- Robust reporting and export.

- Polished UI/UX.

- Comprehensive test coverage.


---

Deployment & DevOps

Environment Variables (Updated for Bun & Clerk)

	# .env.example
	
	# Database
	DATABASE_URL="postgresql://user:password@localhost:5432/productplan_db"
	
	# Clerk
	CLERK_SECRET_KEY="sk_live_..."
	VITE_CLERK_PUBLISHABLE_KEY="pk_live_..."
	CLERK_WEBHOOK_SECRET="whsec_..." # Svix secret for webhooks
	
	# Bun Server
	PORT=3001
	VITE_API_BASE_URL="http://localhost:3001" # For frontend to call backend
	
	# Redis
	REDIS_URL="redis://localhost:6379"
	
	# AI Services (Optional)
	OPENAI_API_KEY="your-openai-key"
	
	# Super Admin (For initial setup and direct access)
	SUPER_ADMIN_EMAIL="superadmin@productplan.com"
	SUPER_ADMIN_PASSWORD="superadmin123" # Use strong, secure methods in production

Bun package.json Scripts

	{
	  "name": "productplan",
	  "version": "1.0.0",
	  "module": "src/main.tsx",
	  "scripts": {
	    "dev": "bun run frontend:dev & bun run server:dev",
	    "frontend:dev": "vite",
	    "frontend:build": "vite build",
	    "frontend:preview": "vite preview",
	    "server:dev": "bun --watch server/src/index.ts",
	    "server:start": "bun server/src/index.ts",
	    "prisma:generate": "prisma generate",
	    "prisma:migrate:dev": "prisma migrate dev",
	    "prisma:migrate:deploy": "prisma migrate deploy",
	    "prisma:seed": "bun run prisma/seed.ts",
	    "prisma:studio": "prisma studio",
	    "test": "vitest",
	    "test:e2e": "playwright test",
	    "test:e2e:ui": "playwright test --ui",
	    "lint": "eslint . --ext ts,tsx",
	    "lint:fix": "eslint . --ext ts,tsx --fix",
	    "format": "prettier --write \"**/*.{ts,tsx,json,md,toml}\"",
	    "type-check": "tsc --noEmit",
	    "shadcn:add": "bunx shadcn-ui@latest add",
	    "shadcn:init": "bunx shadcn-ui@latest init"
	  },
	  "dependencies": {
	    "@clerk/clerk-react": "^5.61.0",
	    "@clerk/clerk-sdk-node": "^1.28.0",
	    "@fastify/cors": "^9.0.1",
	    "@fastify/helmet": "^11.1.1",
	    "@prisma/client": "^7.4.2",
	    "@radix-ui/react-slot": "^1.1.0",
	    "@tanstack/react-form": "^0.41.0",
	    "@tanstack/react-query": "^5.90.21",
	    "@tanstack/react-router": "^1.93.3",
	    "@tanstack/react-table": "^8.20.6",
	    "argon2": "^0.40.1",
	    "class-variance-authority": "^0.7.0",
	    "clsx": "^2.1.1",
	    "dotenv": "^16.4.5",
	    "express": "^4.21.2",
	    "fastify": "^4.27.0",
	    "lucide-react": "^0.395.0",
	    "morgan": "^1.10.0",
	    "react": "^19.2.4",
	    "react-dom": "^19.2.4",
	    "svix": "^1.24.0",
	    "tailwind-merge": "^2.3.0",
	    "tailwindcss-animate": "^1.0.7",
	    "zod": "^3.24.1"
	  },
	  "devDependencies": {
	    "@playwright/test": "^1.49.1",
	    "@tanstack/eslint-plugin-query": "^5.50.1",
	    "@tanstack/router-vite-plugin": "^1.93.2",
	    "@types/bun": "^1.1.6",
	    "@types/express": "^4.17.21",
	    "@types/morgan": "^1.9.9",
	    "@types/react": "^19.0.0",
	    "@types/react-dom": "^19.0.0",
	    "@typescript-eslint/eslint-plugin": "^7.15.0",
	    "@typescript-eslint/parser": "^7.15.0",
	    "@vitejs/plugin-react": "^5.0.1",
	    "autoprefixer": "^10.4.19",
	    "eslint": "^9.6.0",
	    "eslint-plugin-react-hooks": "^4.6.2",
	    "eslint-plugin-react-refresh": "^0.4.7",
	    "postcss": "^8.4.38",
	    "prettier": "^3.3.2",
	    "prisma": "^7.4.2",
	    "tailwindcss": "^4.0.0-next.1",
	    "tsx": "^4.16.2",
	    "typescript": "^5.7.3",
	    "vite": "^6.0.7",
	    "vitest": "^2.1.8"
	  },
	  "trustedDependencies": ["@clerk/clerk-sdk-node"]
	}