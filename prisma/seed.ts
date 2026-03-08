import { PrismaClient } from '../src/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ────────────────────────────────────────────────────
  // Clean existing data (reverse dependency order)
  // ────────────────────────────────────────────────────
  console.log('Cleaning existing data...')
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.customField.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.roadmapItem.deleteMany()
  await prisma.release.deleteMany()
  await prisma.roadmap.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.idea.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.productMember.deleteMany()
  await prisma.product.deleteMany()
  await prisma.clientUser.deleteMany()
  await prisma.client.deleteMany()
  await prisma.appUser.deleteMany()

  // ────────────────────────────────────────────────────
  // App Users
  // ────────────────────────────────────────────────────
  const superAdminUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_superadmin',
      email: 'admin@productplan.com',
      name: 'Platform Admin',
      isSuperAdmin: true,
    },
  })

  const acmeAdminUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_acme_admin',
      email: 'alice@acme.com',
      name: 'Alice Chen',
    },
  })

  const acmeContribUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_acme_contrib',
      email: 'bob@acme.com',
      name: 'Bob Martinez',
    },
  })

  const acmeViewerUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_acme_viewer',
      email: 'carol@acme.com',
      name: 'Carol Wilson',
    },
  })

  const tsAdminUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_ts_admin',
      email: 'dave@techstart.io',
      name: 'Dave Kumar',
    },
  })

  const tsContribUser = await prisma.appUser.create({
    data: {
      clerkUserId: 'user_seed_ts_contrib',
      email: 'eve@techstart.io',
      name: 'Eve Thompson',
    },
  })
  console.log('Created 6 AppUsers (1 super admin)')

  // ────────────────────────────────────────────────────
  // Clients (Organizations)
  // ────────────────────────────────────────────────────
  const demo = await prisma.client.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo',
      status: 'ACTIVE',
      isDemo: true,
    },
  })

  const acme = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'ACTIVE',
    },
  })

  const techstart = await prisma.client.create({
    data: {
      name: 'TechStart Inc',
      slug: 'techstart-inc',
      status: 'ACTIVE',
    },
  })
  console.log('Created 3 clients (1 demo, 2 regular)')

  // ────────────────────────────────────────────────────
  // Client Users (Org Memberships)
  // ────────────────────────────────────────────────────
  // Super admin is a member of all orgs
  await prisma.clientUser.create({
    data: { userId: superAdminUser.id, clientId: acme.id, role: 'ADMIN' },
  })
  await prisma.clientUser.create({
    data: { userId: superAdminUser.id, clientId: techstart.id, role: 'ADMIN' },
  })

  // Acme Corp members
  await prisma.clientUser.create({
    data: { userId: acmeAdminUser.id, clientId: acme.id, role: 'ADMIN' },
  })
  await prisma.clientUser.create({
    data: { userId: acmeContribUser.id, clientId: acme.id, role: 'CONTRIBUTOR' },
  })
  await prisma.clientUser.create({
    data: { userId: acmeViewerUser.id, clientId: acme.id, role: 'VIEWER' },
  })

  // TechStart Inc members
  await prisma.clientUser.create({
    data: { userId: tsAdminUser.id, clientId: techstart.id, role: 'ADMIN' },
  })
  await prisma.clientUser.create({
    data: { userId: tsContribUser.id, clientId: techstart.id, role: 'CONTRIBUTOR' },
  })

  // Set active org for users
  await prisma.appUser.update({
    where: { id: superAdminUser.id },
    data: { activeClientId: acme.id },
  })
  await prisma.appUser.update({
    where: { id: acmeAdminUser.id },
    data: { activeClientId: acme.id },
  })
  await prisma.appUser.update({
    where: { id: tsAdminUser.id },
    data: { activeClientId: techstart.id },
  })
  console.log('Created 7 org memberships')

  // ────────────────────────────────────────────────────
  // Tags
  // ────────────────────────────────────────────────────
  const tagUX = await prisma.tag.create({ data: { name: 'ux' } })
  const tagPerformance = await prisma.tag.create({ data: { name: 'performance' } })
  const tagSecurity = await prisma.tag.create({ data: { name: 'security' } })
  const tagIntegration = await prisma.tag.create({ data: { name: 'integration' } })
  const tagMobile = await prisma.tag.create({ data: { name: 'mobile' } })
  const tagAPI = await prisma.tag.create({ data: { name: 'api' } })
  const tagAnalytics = await prisma.tag.create({ data: { name: 'analytics' } })
  const tagOnboarding = await prisma.tag.create({ data: { name: 'onboarding' } })
  const tagAI = await prisma.tag.create({ data: { name: 'ai' } })
  const tagAccessibility = await prisma.tag.create({ data: { name: 'accessibility' } })
  console.log('Created 10 tags')

  // ════════════════════════════════════════════════════
  // DEMO ORGANIZATION — Rich example data
  // ════════════════════════════════════════════════════

  // ── Demo Products ──
  const demoTaskFlow = await prisma.product.create({
    data: {
      name: 'TaskFlow Pro',
      description: 'Modern project management tool with AI-powered task prioritization and team collaboration features.',
      vision: 'Become the most intuitive project management platform for growing teams.',
      strategy: 'Focus on AI-assisted workflows and seamless integrations with developer tools.',
      status: 'ACTIVE',
      color: '#6366F1',
      icon: 'layers',
      clientId: demo.id,
    },
  })

  const demoInsightHub = await prisma.product.create({
    data: {
      name: 'InsightHub',
      description: 'Customer feedback aggregation and analytics platform with sentiment analysis.',
      vision: 'Help product teams make data-driven decisions from customer feedback.',
      strategy: 'Build best-in-class NLP capabilities and integrate with support tools.',
      status: 'ACTIVE',
      color: '#EC4899',
      icon: 'bar-chart-2',
      clientId: demo.id,
    },
  })

  const demoDevPortal = await prisma.product.create({
    data: {
      name: 'Developer Portal',
      description: 'API documentation, SDK management, and developer onboarding platform.',
      status: 'ACTIVE',
      color: '#14B8A6',
      icon: 'code',
      clientId: demo.id,
    },
  })

  const demoMobileSDK = await prisma.product.create({
    data: {
      name: 'Mobile SDK',
      description: 'Cross-platform mobile SDK for integrating TaskFlow features into native apps.',
      status: 'DRAFT',
      color: '#F97316',
      icon: 'smartphone',
      clientId: demo.id,
    },
  })
  console.log('Created 4 demo products')

  // ── Demo Product Members ──
  await prisma.productMember.createMany({
    data: [
      { productId: demoTaskFlow.id, userId: superAdminUser.id, role: 'OWNER', clientId: demo.id },
      { productId: demoTaskFlow.id, userId: acmeAdminUser.id, role: 'MEMBER', clientId: demo.id },
      { productId: demoInsightHub.id, userId: acmeContribUser.id, role: 'OWNER', clientId: demo.id },
      { productId: demoInsightHub.id, userId: superAdminUser.id, role: 'MEMBER', clientId: demo.id },
      { productId: demoDevPortal.id, userId: tsAdminUser.id, role: 'OWNER', clientId: demo.id },
      { productId: demoMobileSDK.id, userId: tsContribUser.id, role: 'OWNER', clientId: demo.id },
    ],
  })

  // ── Demo Ideas — TaskFlow Pro ──
  const demoIdea1 = await prisma.idea.create({
    data: {
      title: 'AI-powered task auto-assignment',
      description: 'Use machine learning to automatically assign tasks to the best team member based on skills, workload, and past performance. The system would learn from historical assignment patterns and optimize for balanced workloads.',
      status: 'PLANNED',
      clientId: demo.id, productId: demoTaskFlow.id,
      authorId: superAdminUser.id,
      riceReach: 8000, riceImpact: 3, riceConfidence: 0.7, riceEffort: 6,
      riceScore: 2800.0, votes: 89,
      tags: { connect: [{ id: tagAI.id }, { id: tagUX.id }] },
    },
  })

  const demoIdea2 = await prisma.idea.create({
    data: {
      title: 'Real-time collaborative whiteboards',
      description: 'Add a built-in whiteboard tool that supports real-time collaboration with drawing, sticky notes, flowcharts, and mind maps. Should integrate seamlessly with existing task boards.',
      status: 'IN_PROGRESS',
      clientId: demo.id, productId: demoTaskFlow.id,
      authorId: acmeAdminUser.id,
      riceReach: 5000, riceImpact: 3, riceConfidence: 0.8, riceEffort: 8,
      riceScore: 1500.0, votes: 67,
      tags: { connect: [{ id: tagUX.id }] },
    },
  })

  const demoIdea3 = await prisma.idea.create({
    data: {
      title: 'Dark mode and custom themes',
      description: 'Support system-level dark mode detection and allow teams to customize their workspace theme with brand colors. Should support WCAG AA contrast requirements.',
      status: 'COMPLETED',
      clientId: demo.id, productId: demoTaskFlow.id,
      authorId: acmeContribUser.id,
      riceReach: 12000, riceImpact: 2, riceConfidence: 0.95, riceEffort: 3,
      riceScore: 7600.0, votes: 156,
      tags: { connect: [{ id: tagUX.id }, { id: tagAccessibility.id }] },
    },
  })

  const demoIdea4 = await prisma.idea.create({
    data: {
      title: 'GitHub and GitLab integration',
      description: 'Bidirectional sync between TaskFlow tasks and GitHub/GitLab issues. Auto-update task status when PRs are merged. Show code activity on task cards.',
      status: 'UNDER_REVIEW',
      clientId: demo.id, productId: demoTaskFlow.id,
      authorId: tsAdminUser.id,
      riceReach: 6000, riceImpact: 3, riceConfidence: 0.85, riceEffort: 5,
      riceScore: 3060.0, votes: 112,
      tags: { connect: [{ id: tagIntegration.id }] },
    },
  })

  const demoIdea5 = await prisma.idea.create({
    data: {
      title: 'Keyboard shortcuts and command palette',
      description: 'Implement a Cmd+K command palette for quick navigation and action execution. Support customizable keyboard shortcuts for all common actions.',
      status: 'SUBMITTED',
      clientId: demo.id, productId: demoTaskFlow.id,
      authorId: acmeViewerUser.id,
      votes: 43,
      tags: { connect: [{ id: tagUX.id }] },
    },
  })

  // ── Demo Ideas — InsightHub ──
  const demoIdea6 = await prisma.idea.create({
    data: {
      title: 'Sentiment trend dashboard',
      description: 'A real-time dashboard showing sentiment trends across all feedback channels. Include ability to drill down by product area, customer segment, and time period.',
      status: 'PLANNED',
      clientId: demo.id, productId: demoInsightHub.id,
      authorId: acmeContribUser.id,
      riceReach: 4000, riceImpact: 3, riceConfidence: 0.9, riceEffort: 4,
      riceScore: 2700.0, votes: 73,
      tags: { connect: [{ id: tagAnalytics.id }, { id: tagAI.id }] },
    },
  })

  const demoIdea7 = await prisma.idea.create({
    data: {
      title: 'Slack and Intercom feedback ingestion',
      description: 'Automatically pull customer feedback from Slack channels and Intercom conversations. Use NLP to categorize and route feedback to relevant product areas.',
      status: 'IN_PROGRESS',
      clientId: demo.id, productId: demoInsightHub.id,
      authorId: superAdminUser.id,
      riceReach: 3500, riceImpact: 2, riceConfidence: 0.85, riceEffort: 3,
      riceScore: 1983.33, votes: 58,
      tags: { connect: [{ id: tagIntegration.id }] },
    },
  })

  const demoIdea8 = await prisma.idea.create({
    data: {
      title: 'Competitive analysis module',
      description: 'Track competitor feature launches and compare with our roadmap. Alert product managers when competitors ship features our customers have been requesting.',
      status: 'SUBMITTED',
      clientId: demo.id, productId: demoInsightHub.id,
      authorId: tsContribUser.id,
      votes: 31,
      tags: { connect: [{ id: tagAnalytics.id }] },
    },
  })

  // ── Demo Ideas — Developer Portal ──
  const demoIdea9 = await prisma.idea.create({
    data: {
      title: 'Interactive API playground',
      description: 'Build a browser-based API explorer where developers can make live API calls, see responses, and generate code snippets in multiple languages.',
      status: 'PLANNED',
      clientId: demo.id, productId: demoDevPortal.id,
      authorId: tsAdminUser.id,
      riceReach: 3000, riceImpact: 3, riceConfidence: 0.8, riceEffort: 5,
      riceScore: 1440.0, votes: 45,
      tags: { connect: [{ id: tagAPI.id }, { id: tagUX.id }] },
    },
  })

  const demoIdea10 = await prisma.idea.create({
    data: {
      title: 'Webhook event log and debugger',
      description: 'Provide developers with a real-time log of webhook deliveries, including payloads, response codes, and retry history. Include a replay button for failed deliveries.',
      status: 'UNDER_REVIEW',
      clientId: demo.id, productId: demoDevPortal.id,
      authorId: acmeContribUser.id,
      riceReach: 2000, riceImpact: 2, riceConfidence: 0.9, riceEffort: 3,
      riceScore: 1200.0, votes: 37,
      tags: { connect: [{ id: tagAPI.id }] },
    },
  })
  console.log('Created 10 demo ideas')

  // ── Demo Roadmaps ──
  const demoTaskFlowRoadmap = await prisma.roadmap.create({
    data: {
      name: 'TaskFlow Pro H1 2026',
      description: 'Major feature initiatives for the first half of 2026',
      clientId: demo.id, productId: demoTaskFlow.id, isPublic: true,
    },
  })

  const demoInsightRoadmap = await prisma.roadmap.create({
    data: {
      name: 'InsightHub Q1-Q2 2026',
      description: 'Analytics and integration improvements',
      clientId: demo.id, productId: demoInsightHub.id, isPublic: true,
    },
  })

  const demoDevPortalRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Developer Portal v2.0',
      description: 'Next-generation developer experience',
      clientId: demo.id, productId: demoDevPortal.id, isPublic: false,
    },
  })
  console.log('Created 3 demo roadmaps')

  // ── Demo Releases ──
  const demoRelease1 = await prisma.release.create({
    data: {
      name: 'v4.0.0 — Collaboration',
      description: 'Major release focused on real-time collaboration features',
      targetDate: new Date('2026-03-15'),
      status: 'IN_PROGRESS',
      roadmapId: demoTaskFlowRoadmap.id,
    },
  })

  const demoRelease2 = await prisma.release.create({
    data: {
      name: 'v4.1.0 — AI Features',
      description: 'AI-powered task management and automation',
      targetDate: new Date('2026-05-01'),
      status: 'PLANNED',
      roadmapId: demoTaskFlowRoadmap.id,
    },
  })

  const demoRelease3 = await prisma.release.create({
    data: {
      name: 'v4.2.0 — Integrations',
      description: 'Deep integrations with development tools',
      targetDate: new Date('2026-06-30'),
      status: 'PLANNED',
      roadmapId: demoTaskFlowRoadmap.id,
    },
  })

  const demoRelease4 = await prisma.release.create({
    data: {
      name: 'v2.0.0 — Analytics Overhaul',
      description: 'Complete redesign of the analytics engine',
      targetDate: new Date('2026-04-01'),
      status: 'IN_PROGRESS',
      roadmapId: demoInsightRoadmap.id,
    },
  })

  const demoRelease5 = await prisma.release.create({
    data: {
      name: 'v2.1.0 — Integrations',
      description: 'Third-party feedback source integrations',
      targetDate: new Date('2026-06-01'),
      status: 'PLANNED',
      roadmapId: demoInsightRoadmap.id,
    },
  })

  const demoRelease6 = await prisma.release.create({
    data: {
      name: 'v2.0.0 — New Portal',
      description: 'Complete developer portal rebuild',
      targetDate: new Date('2026-05-15'),
      status: 'PLANNED',
      roadmapId: demoDevPortalRoadmap.id,
    },
  })
  console.log('Created 6 demo releases')

  // ── Demo Roadmap Items (Features) ──
  const featureData = [
    // TaskFlow — v4.0.0 Collaboration
    { title: 'Real-time cursor presence', description: 'Show other team members cursors and selections in real-time on boards and documents.', status: 'COMPLETED' as const, priority: 1, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease1.id, startDate: new Date('2026-01-10'), endDate: new Date('2026-02-01') },
    { title: 'Collaborative whiteboard canvas', description: 'Infinite canvas with drawing tools, sticky notes, and shape libraries.', status: 'IN_PROGRESS' as const, priority: 2, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease1.id, startDate: new Date('2026-02-01'), endDate: new Date('2026-03-10') },
    { title: 'Live comments and mentions', description: 'Real-time comment threads with @mentions that send push notifications.', status: 'IN_PROGRESS' as const, priority: 3, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease1.id, startDate: new Date('2026-02-15'), endDate: new Date('2026-03-15') },
    { title: 'Conflict resolution engine', description: 'CRDT-based conflict resolution for simultaneous edits to task fields.', status: 'PLANNED' as const, priority: 4, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease1.id, startDate: new Date('2026-02-20'), endDate: new Date('2026-03-15') },
    // TaskFlow — v4.1.0 AI
    { title: 'AI task auto-assignment', description: 'ML model that suggests optimal task assignments based on team capacity and skills.', status: 'PLANNED' as const, priority: 1, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease2.id, startDate: new Date('2026-03-20'), endDate: new Date('2026-04-15') },
    { title: 'Smart task decomposition', description: 'AI that breaks down large tasks into smaller, actionable subtasks.', status: 'PLANNED' as const, priority: 2, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease2.id, startDate: new Date('2026-03-25'), endDate: new Date('2026-04-20') },
    { title: 'Natural language task creation', description: 'Create tasks by typing natural language descriptions that auto-fill fields.', status: 'PLANNED' as const, priority: 3, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease2.id, startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30') },
    // TaskFlow — v4.2.0 Integrations
    { title: 'GitHub bidirectional sync', description: 'Two-way sync between TaskFlow tasks and GitHub issues with status mapping.', status: 'PLANNED' as const, priority: 1, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease3.id, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-30') },
    { title: 'GitLab MR integration', description: 'Link GitLab merge requests to tasks and auto-update status on merge.', status: 'PLANNED' as const, priority: 2, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease3.id, startDate: new Date('2026-05-10'), endDate: new Date('2026-06-10') },
    { title: 'Slack notifications bot', description: 'Configurable Slack bot for task updates, assignments, and due date reminders.', status: 'PLANNED' as const, priority: 3, roadmapId: demoTaskFlowRoadmap.id, releaseId: demoRelease3.id, startDate: new Date('2026-05-15'), endDate: new Date('2026-06-25') },
    // InsightHub — v2.0.0
    { title: 'Sentiment analysis pipeline', description: 'NLP pipeline for real-time sentiment classification of customer feedback.', status: 'IN_PROGRESS' as const, priority: 1, roadmapId: demoInsightRoadmap.id, releaseId: demoRelease4.id, startDate: new Date('2026-01-15'), endDate: new Date('2026-03-01') },
    { title: 'Trend detection algorithm', description: 'Automatically detect emerging themes and sentiment shifts in feedback data.', status: 'PLANNED' as const, priority: 2, roadmapId: demoInsightRoadmap.id, releaseId: demoRelease4.id, startDate: new Date('2026-02-15'), endDate: new Date('2026-03-20') },
    { title: 'Custom dashboard builder', description: 'Drag-and-drop dashboard editor with configurable widgets and filters.', status: 'PLANNED' as const, priority: 3, roadmapId: demoInsightRoadmap.id, releaseId: demoRelease4.id, startDate: new Date('2026-03-01'), endDate: new Date('2026-03-30') },
    // InsightHub — v2.1.0 (targetDate: 2026-06-01)
    { title: 'Slack feedback ingestion', description: 'Pull customer feedback from designated Slack channels automatically.', status: 'PLANNED' as const, priority: 1, roadmapId: demoInsightRoadmap.id, releaseId: demoRelease5.id, startDate: new Date('2026-04-01'), endDate: new Date('2026-05-15') },
    { title: 'Intercom conversation sync', description: 'Import and categorize feedback from Intercom conversations.', status: 'PLANNED' as const, priority: 2, roadmapId: demoInsightRoadmap.id, releaseId: demoRelease5.id, startDate: new Date('2026-04-15'), endDate: new Date('2026-05-30') },
    // Dev Portal — v2.0.0
    { title: 'Interactive API playground', description: 'Browser-based API explorer with live request/response testing.', status: 'PLANNED' as const, priority: 1, roadmapId: demoDevPortalRoadmap.id, releaseId: demoRelease6.id, startDate: new Date('2026-03-15'), endDate: new Date('2026-04-30') },
    { title: 'Multi-language code generation', description: 'Auto-generate SDK code snippets in Python, JavaScript, Go, and Java.', status: 'PLANNED' as const, priority: 2, roadmapId: demoDevPortalRoadmap.id, releaseId: demoRelease6.id, startDate: new Date('2026-04-01'), endDate: new Date('2026-05-10') },
    // Dev Portal — v2.0.0 (targetDate: 2026-05-15)
    { title: 'Webhook debugger', description: 'Real-time webhook delivery log with payload inspection and replay.', status: 'PLANNED' as const, priority: 3, roadmapId: demoDevPortalRoadmap.id, releaseId: demoRelease6.id, startDate: new Date('2026-04-15'), endDate: new Date('2026-05-10') },
    // Unassigned features
    { title: 'Mobile app push notifications', description: 'Push notification support for the mobile SDK.', status: 'BACKLOG' as const, priority: 0, roadmapId: demoTaskFlowRoadmap.id },
    { title: 'Offline mode for mobile', description: 'Local-first data storage with background sync for mobile apps.', status: 'BACKLOG' as const, priority: 0, roadmapId: demoTaskFlowRoadmap.id },
  ]

  for (const f of featureData) {
    await prisma.roadmapItem.create({ data: f })
  }
  console.log(`Created ${featureData.length} demo roadmap items`)

  // ── Demo Issues ──
  const demoIssue1 = await prisma.issue.create({
    data: {
      title: 'Board view crashes when dragging tasks between columns on Firefox',
      description: 'The Kanban board view crashes with an unhandled DragEvent error when dragging tasks between columns on Firefox 120+. The drag ghost image renders incorrectly and the drop handler throws. Chrome and Safari work fine. Affects approximately 12% of our user base.',
      severity: 'HIGH', status: 'IN_PROGRESS',
      clientId: demo.id, productId: demoTaskFlow.id,
      reporterId: acmeContribUser.id, assigneeId: superAdminUser.id,
      customersAffected: 450,
    },
  })

  const demoIssue2 = await prisma.issue.create({
    data: {
      title: 'Export to PDF generates blank pages for tasks with images',
      description: 'When exporting a project to PDF, any task that contains embedded images results in a blank page. The images are not rendered and the text content is also lost for those tasks.',
      severity: 'MEDIUM', status: 'OPEN',
      clientId: demo.id, productId: demoTaskFlow.id,
      reporterId: acmeViewerUser.id,
      customersAffected: 120,
    },
  })

  const demoIssue3 = await prisma.issue.create({
    data: {
      title: 'Memory leak in real-time WebSocket connection',
      description: 'The WebSocket connection for live updates causes a gradual memory increase. After approximately 4 hours of continuous use, the browser tab becomes unresponsive. Heap snapshot shows detached DOM nodes from notification re-renders.',
      severity: 'CRITICAL', status: 'IN_PROGRESS',
      clientId: demo.id, productId: demoTaskFlow.id,
      reporterId: tsAdminUser.id, assigneeId: acmeAdminUser.id,
      customersAffected: 800,
    },
  })

  const demoIssue4 = await prisma.issue.create({
    data: {
      title: 'Sentiment scores inconsistent between batch and real-time processing',
      description: 'The sentiment analysis gives different scores for the same text when processed via batch import vs. real-time ingestion. The batch processor uses an older model version.',
      severity: 'HIGH', status: 'OPEN',
      clientId: demo.id, productId: demoInsightHub.id,
      reporterId: superAdminUser.id,
      customersAffected: 200,
    },
  })

  const demoIssue5 = await prisma.issue.create({
    data: {
      title: 'API rate limit response missing Retry-After header',
      description: 'When the API returns a 429 status, the Retry-After header is not included in the response. This makes it difficult for SDK consumers to implement proper backoff.',
      severity: 'MEDIUM', status: 'OPEN',
      clientId: demo.id, productId: demoDevPortal.id,
      reporterId: tsContribUser.id,
      customersAffected: 75,
    },
  })

  const demoIssue6 = await prisma.issue.create({
    data: {
      title: 'Search results pagination returns duplicate items',
      description: 'When paginating through search results with sort by relevance, the same items sometimes appear on consecutive pages. This is due to score ties combined with an unstable sort.',
      severity: 'LOW', status: 'RESOLVED',
      clientId: demo.id, productId: demoTaskFlow.id,
      reporterId: acmeContribUser.id, assigneeId: superAdminUser.id,
      customersAffected: 50,
    },
  })
  console.log('Created 6 demo issues')

  // ── Demo Goals ──
  await prisma.goal.createMany({
    data: [
      { title: 'Reach 25,000 weekly active users', description: 'Grow WAU from 14,200 to 25,000 by end of H1 2026.', targetValue: 25000, currentValue: 14200, productId: demoTaskFlow.id },
      { title: 'Reduce P95 page load to under 800ms', description: 'Optimize all critical paths to sub-800ms P95 latency.', targetValue: 800, currentValue: 1200, productId: demoTaskFlow.id },
      { title: 'Achieve 4.7 star rating on G2', description: 'Improve G2 rating from 4.3 to 4.7 through UX improvements.', targetValue: 4.7, currentValue: 4.3, productId: demoTaskFlow.id },
      { title: 'Process 1M feedback items monthly', description: 'Scale the ingestion pipeline to handle 1 million items per month.', targetValue: 1000000, currentValue: 340000, productId: demoInsightHub.id },
      { title: '95% sentiment accuracy', description: 'Improve sentiment classification accuracy from 87% to 95%.', targetValue: 95, currentValue: 87, productId: demoInsightHub.id },
      { title: 'API uptime 99.99%', description: 'Maintain four-nines availability across all API endpoints.', targetValue: 99.99, currentValue: 99.94, productId: demoDevPortal.id },
    ],
  })
  console.log('Created 6 demo goals')

  // ── Demo Custom Fields ──
  await prisma.customField.createMany({
    data: [
      { name: 'Customer Segment', fieldType: 'select', options: ['Enterprise', 'Mid-Market', 'SMB', 'Startup'], productId: demoTaskFlow.id },
      { name: 'Revenue Impact ($)', fieldType: 'number', productId: demoTaskFlow.id },
      { name: 'T-shirt Size', fieldType: 'select', options: ['XS', 'S', 'M', 'L', 'XL'], productId: demoTaskFlow.id },
      { name: 'Feedback Source', fieldType: 'select', options: ['Support Ticket', 'In-app', 'Social Media', 'Sales Call', 'Survey'], productId: demoInsightHub.id },
      { name: 'SDK Language', fieldType: 'select', options: ['JavaScript', 'Python', 'Go', 'Java', 'Ruby', 'PHP'], productId: demoDevPortal.id },
    ],
  })
  console.log('Created 5 demo custom fields')

  // ── Demo Comments ──
  const demoComments = [
    { content: 'This would be a game-changer for our remote teams. Currently we\'re using Miro alongside TaskFlow which creates context-switching fatigue.', authorId: acmeAdminUser.id, ideaId: demoIdea2.id },
    { content: 'We\'ve been testing the dark mode internally and it\'s beautiful. The OKLCH color system was the right call — the contrast ratios are much better than our previous HSL approach.', authorId: superAdminUser.id, ideaId: demoIdea3.id },
    { content: 'Our engineering team would love this. We currently spend 30 minutes daily manually syncing GitHub issues with TaskFlow tasks.', authorId: tsAdminUser.id, ideaId: demoIdea4.id },
    { content: 'Strongly agree. A command palette alone would reduce the number of clicks for common operations by 60-70%.', authorId: acmeContribUser.id, ideaId: demoIdea5.id },
    { content: 'Can confirm this happens consistently on Firefox 121 and 122. The event.dataTransfer.getData call returns an empty string.', authorId: acmeAdminUser.id, issueId: demoIssue1.id },
    { content: 'Root cause identified: Firefox handles the dragstart event differently for elements inside a shadow DOM. Working on a polyfill.', authorId: superAdminUser.id, issueId: demoIssue1.id },
    { content: 'Profiled with Chrome DevTools. The leak originates from uncleared interval timers in the notification polling service. Each reconnect creates a new interval without clearing the previous one.', authorId: acmeAdminUser.id, issueId: demoIssue3.id },
    { content: 'This should be P0. We have enterprise customers threatening to churn over this instability.', authorId: tsAdminUser.id, issueId: demoIssue3.id },
    { content: 'The batch processor is pinned to model v2.3 while the real-time pipeline uses v2.7. We need to align both to the latest version with a controlled rollout.', authorId: superAdminUser.id, issueId: demoIssue4.id },
    { content: 'The AI features really set this apart from competitors. Would love to see priority suggestions based on team velocity data too.', authorId: acmeContribUser.id, ideaId: demoIdea1.id },
  ]
  for (const c of demoComments) {
    await prisma.comment.create({ data: c })
  }
  console.log(`Created ${demoComments.length} demo comments`)

  // ── Demo Notifications ──
  await prisma.notification.createMany({
    data: [
      { type: 'IDEA_VOTED', title: 'Your idea received votes', message: 'AI-powered task auto-assignment has reached 89 votes', recipientId: superAdminUser.id, clientId: demo.id, ideaId: demoIdea1.id },
      { type: 'IDEA_STATUS_CHANGED', title: 'Idea status updated', message: '"Dark mode and custom themes" has been marked as completed', recipientId: acmeContribUser.id, clientId: demo.id, ideaId: demoIdea3.id, read: true },
      { type: 'ISSUE_ASSIGNED', title: 'Issue assigned to you', message: 'You were assigned to "Memory leak in real-time WebSocket connection"', recipientId: acmeAdminUser.id, clientId: demo.id, issueId: demoIssue3.id },
      { type: 'ISSUE_COMMENTED', title: 'New comment on issue', message: 'Someone commented on "Board view crashes when dragging tasks"', recipientId: superAdminUser.id, clientId: demo.id, issueId: demoIssue1.id },
      { type: 'IDEA_COMMENTED', title: 'New comment on your idea', message: 'Someone commented on "GitHub and GitLab integration"', recipientId: tsAdminUser.id, clientId: demo.id, ideaId: demoIdea4.id },
    ],
  })
  console.log('Created 5 demo notifications')

  // ════════════════════════════════════════════════════
  // ACME CORP — Products & Data
  // ════════════════════════════════════════════════════

  const acmeWebApp = await prisma.product.create({
    data: {
      name: 'Acme Web App',
      description: 'Core web application for Acme customers',
      vision: 'Become the leading platform for widget management',
      strategy: 'Focus on ease-of-use and enterprise integrations',
      status: 'ACTIVE', color: '#3B82F6', icon: 'globe',
      clientId: acme.id,
    },
  })

  const acmeMobileApp = await prisma.product.create({
    data: {
      name: 'Acme Mobile',
      description: 'Mobile companion app for on-the-go access',
      vision: 'Full feature parity with web on mobile devices',
      status: 'ACTIVE', color: '#10B981', icon: 'smartphone',
      clientId: acme.id,
    },
  })

  const acmeAPI = await prisma.product.create({
    data: {
      name: 'Acme Developer API',
      description: 'Public REST and GraphQL API for third-party integrations',
      status: 'DRAFT', color: '#F59E0B', icon: 'code',
      clientId: acme.id,
    },
  })
  console.log('Created 3 Acme products')

  // Acme Product Members
  await prisma.productMember.createMany({
    data: [
      { productId: acmeWebApp.id, userId: acmeAdminUser.id, role: 'OWNER', clientId: acme.id },
      { productId: acmeWebApp.id, userId: acmeContribUser.id, role: 'MEMBER', clientId: acme.id },
      { productId: acmeMobileApp.id, userId: acmeContribUser.id, role: 'OWNER', clientId: acme.id },
      { productId: acmeAPI.id, userId: acmeAdminUser.id, role: 'OWNER', clientId: acme.id },
    ],
  })

  // Acme Ideas
  const acmeIdea1 = await prisma.idea.create({
    data: {
      title: 'Add dark mode support',
      description: 'Users have been requesting dark mode for eye strain reduction.',
      status: 'PLANNED', clientId: acme.id, productId: acmeWebApp.id,
      authorId: acmeContribUser.id,
      riceReach: 5000, riceImpact: 2, riceConfidence: 0.8, riceEffort: 3,
      riceScore: 2666.67, votes: 47,
      tags: { connect: [{ id: tagUX.id }] },
    },
  })

  await prisma.idea.create({
    data: {
      title: 'Real-time collaboration',
      description: 'Allow multiple users to edit simultaneously.',
      status: 'UNDER_REVIEW', clientId: acme.id, productId: acmeWebApp.id,
      authorId: acmeAdminUser.id,
      riceReach: 3000, riceImpact: 3, riceConfidence: 0.6, riceEffort: 8,
      riceScore: 675.0, votes: 32,
      tags: { connect: [{ id: tagUX.id }, { id: tagPerformance.id }] },
    },
  })

  await prisma.idea.create({
    data: {
      title: 'Offline mode for mobile',
      description: 'Support offline access with automatic sync.',
      status: 'IN_PROGRESS', clientId: acme.id, productId: acmeMobileApp.id,
      authorId: acmeContribUser.id,
      riceReach: 2000, riceImpact: 3, riceConfidence: 0.7, riceEffort: 5,
      riceScore: 840.0, votes: 25,
      tags: { connect: [{ id: tagMobile.id }, { id: tagPerformance.id }] },
    },
  })

  // Acme Roadmap
  const acmeRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Q1-Q2 2026 Web App Roadmap',
      description: 'Major initiatives for the web application',
      clientId: acme.id, productId: acmeWebApp.id, isPublic: false,
    },
  })

  const acmeRelease1 = await prisma.release.create({
    data: { name: 'v3.1.0', description: 'Dark mode and UX improvements', targetDate: new Date('2026-02-15'), status: 'IN_PROGRESS', roadmapId: acmeRoadmap.id },
  })

  const acmeRelease2 = await prisma.release.create({
    data: { name: 'v3.2.0', description: 'Collaboration features', targetDate: new Date('2026-04-30'), status: 'PLANNED', roadmapId: acmeRoadmap.id },
  })

  await prisma.roadmapItem.createMany({
    data: [
      { title: 'Implement dark mode theme tokens', status: 'IN_PROGRESS', priority: 1, roadmapId: acmeRoadmap.id, releaseId: acmeRelease1.id, startDate: new Date('2026-01-15'), endDate: new Date('2026-02-01') },
      { title: 'Component dark mode audit', status: 'COMPLETED', priority: 2, roadmapId: acmeRoadmap.id, releaseId: acmeRelease1.id, startDate: new Date('2026-01-05'), endDate: new Date('2026-01-14') },
      { title: 'Real-time collaboration engine', status: 'PLANNED', priority: 1, roadmapId: acmeRoadmap.id, releaseId: acmeRelease2.id, startDate: new Date('2026-02-20'), endDate: new Date('2026-04-15') },
    ],
  })

  // Acme Issues
  const acmeIssue1 = await prisma.issue.create({
    data: {
      title: 'Dashboard charts fail on Safari 17',
      description: 'Analytics charts show blank canvas on Safari 17.',
      severity: 'HIGH', status: 'IN_PROGRESS',
      clientId: acme.id, productId: acmeWebApp.id,
      reporterId: acmeContribUser.id, assigneeId: acmeAdminUser.id,
      customersAffected: 340,
    },
  })

  await prisma.issue.create({
    data: {
      title: 'CSV export has corrupted UTF-8 characters',
      description: 'Special characters garbled in CSV export on Windows.',
      severity: 'MEDIUM', status: 'OPEN',
      clientId: acme.id, productId: acmeWebApp.id,
      reporterId: acmeViewerUser.id, customersAffected: 85,
    },
  })

  // Acme Goals
  await prisma.goal.createMany({
    data: [
      { title: 'Reach 10,000 MAU', targetValue: 10000, currentValue: 6500, productId: acmeWebApp.id },
      { title: 'Page load under 1.5s', targetValue: 1.5, currentValue: 2.8, productId: acmeWebApp.id },
    ],
  })

  // Acme Comments
  await prisma.comment.createMany({
    data: [
      { content: 'This is a must-have for accessibility.', authorId: acmeAdminUser.id, ideaId: acmeIdea1.id },
      { content: 'Safari issue confirmed on 17.2. Chart library downgrade fixes it.', authorId: acmeContribUser.id, issueId: acmeIssue1.id },
    ],
  })

  // Acme Notifications
  await prisma.notification.createMany({
    data: [
      { type: 'IDEA_VOTED', title: 'Idea received a vote', message: 'Someone voted for "Add dark mode support"', recipientId: acmeContribUser.id, clientId: acme.id, ideaId: acmeIdea1.id },
      { type: 'ISSUE_ASSIGNED', title: 'Issue assigned to you', message: 'You were assigned to "Dashboard charts fail on Safari 17"', recipientId: acmeAdminUser.id, clientId: acme.id, issueId: acmeIssue1.id, read: true },
    ],
  })
  console.log('Created Acme data')

  // ════════════════════════════════════════════════════
  // TECHSTART INC — Products & Data
  // ════════════════════════════════════════════════════

  const tsAnalytics = await prisma.product.create({
    data: {
      name: 'Analytics Dashboard',
      description: 'Real-time analytics platform for SaaS metrics',
      vision: 'The go-to analytics solution for early-stage startups',
      strategy: 'Ship fast, iterate on feedback, focus on time-to-insight',
      status: 'ACTIVE', color: '#8B5CF6', icon: 'bar-chart',
      clientId: techstart.id,
    },
  })

  const tsOnboardingSuite = await prisma.product.create({
    data: {
      name: 'User Onboarding Suite',
      description: 'Guided onboarding flows and checklists for new users',
      status: 'ACTIVE', color: '#EC4899', icon: 'users',
      clientId: techstart.id,
    },
  })
  console.log('Created 2 TechStart products')

  await prisma.productMember.createMany({
    data: [
      { productId: tsAnalytics.id, userId: tsAdminUser.id, role: 'OWNER', clientId: techstart.id },
      { productId: tsAnalytics.id, userId: tsContribUser.id, role: 'MEMBER', clientId: techstart.id },
      { productId: tsOnboardingSuite.id, userId: tsContribUser.id, role: 'OWNER', clientId: techstart.id },
    ],
  })

  // TechStart Ideas
  await prisma.idea.create({
    data: {
      title: 'Funnel visualization widget',
      description: 'Drag-and-drop funnel chart for conversion analysis.',
      status: 'PLANNED', clientId: techstart.id, productId: tsAnalytics.id,
      authorId: tsAdminUser.id,
      riceReach: 4000, riceImpact: 3, riceConfidence: 0.9, riceEffort: 4,
      riceScore: 2700.0, votes: 56,
      tags: { connect: [{ id: tagAnalytics.id }, { id: tagUX.id }] },
    },
  })

  await prisma.idea.create({
    data: {
      title: 'Slack integration for alerts',
      description: 'Send metric alerts and weekly digests to Slack.',
      status: 'IN_PROGRESS', clientId: techstart.id, productId: tsAnalytics.id,
      authorId: tsContribUser.id,
      riceReach: 3500, riceImpact: 2, riceConfidence: 0.85, riceEffort: 2,
      riceScore: 2975.0, votes: 41,
      tags: { connect: [{ id: tagIntegration.id }] },
    },
  })

  await prisma.idea.create({
    data: {
      title: 'Interactive onboarding flow builder',
      description: 'Visual builder for multi-step onboarding flows with branching.',
      status: 'UNDER_REVIEW', clientId: techstart.id, productId: tsOnboardingSuite.id,
      authorId: tsAdminUser.id,
      riceReach: 2500, riceImpact: 3, riceConfidence: 0.7, riceEffort: 6,
      riceScore: 875.0, votes: 29,
      tags: { connect: [{ id: tagUX.id }, { id: tagOnboarding.id }] },
    },
  })

  // TechStart Roadmap
  const tsRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Analytics Platform H1 2026',
      description: 'Feature roadmap through June 2026',
      clientId: techstart.id, productId: tsAnalytics.id, isPublic: true,
    },
  })

  const tsRelease1 = await prisma.release.create({
    data: { name: 'v1.5.0', description: 'Funnel charts and Slack', targetDate: new Date('2026-03-01'), status: 'IN_PROGRESS', roadmapId: tsRoadmap.id },
  })

  await prisma.roadmapItem.createMany({
    data: [
      { title: 'Build funnel chart component', status: 'IN_PROGRESS', priority: 1, roadmapId: tsRoadmap.id, releaseId: tsRelease1.id, startDate: new Date('2026-01-20'), endDate: new Date('2026-02-15') },
      { title: 'Slack webhook integration', status: 'IN_PROGRESS', priority: 2, roadmapId: tsRoadmap.id, releaseId: tsRelease1.id, startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28') },
    ],
  })

  // TechStart Issues
  await prisma.issue.create({
    data: {
      title: 'Memory leak in real-time data stream',
      description: 'WebSocket connection causes gradual memory increase.',
      severity: 'HIGH', status: 'IN_PROGRESS',
      clientId: techstart.id, productId: tsAnalytics.id,
      reporterId: tsContribUser.id, assigneeId: tsAdminUser.id,
      customersAffected: 150,
    },
  })

  await prisma.issue.create({
    data: {
      title: 'Date range picker timezone mismatch',
      description: 'Non-UTC users see data shifted by their UTC offset.',
      severity: 'MEDIUM', status: 'OPEN',
      clientId: techstart.id, productId: tsAnalytics.id,
      reporterId: tsAdminUser.id, customersAffected: 300,
    },
  })

  // TechStart Goals
  await prisma.goal.createMany({
    data: [
      { title: 'Reach 500 paying customers', targetValue: 500, currentValue: 180, productId: tsAnalytics.id },
      { title: 'P95 query time under 200ms', targetValue: 200, currentValue: 450, productId: tsAnalytics.id },
    ],
  })
  console.log('Created TechStart data')

  // ────────────────────────────────────────────────────
  // Done
  // ────────────────────────────────────────────────────
  console.log('')
  console.log('Seeding complete!')
  console.log('  - 6 App Users (1 super admin)')
  console.log('  - 3 Clients (1 demo, 2 regular)')
  console.log('  - 7 Org Memberships')
  console.log('  - 9 Products (4 demo, 3 Acme, 2 TechStart)')
  console.log('  - 13 Ideas (10 demo, 3 Acme)')
  console.log('  - 4 Roadmaps')
  console.log('  - 9 Releases')
  console.log('  - 25+ Roadmap Items')
  console.log('  - 10+ Issues')
  console.log('  - 10+ Goals')
  console.log('  - 10+ Comments')
  console.log('  - 10 Tags')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
