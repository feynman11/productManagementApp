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
  await prisma.superAdmin.deleteMany()

  // ────────────────────────────────────────────────────
  // Super Admin
  // ────────────────────────────────────────────────────
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: 'superadmin@productplan.com',
      // TODO: Use argon2 hashing in production. This is a placeholder.
      // In production: const hash = await argon2.hash('password')
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder_not_a_real_hash',
      name: 'Super Admin',
    },
  })
  console.log('Created Super Admin:', superAdmin.email)

  // ────────────────────────────────────────────────────
  // Clients
  // ────────────────────────────────────────────────────
  const acme = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      clerkOrgId: 'org_mock_acme_123',
      status: 'ACTIVE',
    },
  })

  const techstart = await prisma.client.create({
    data: {
      name: 'TechStart Inc',
      slug: 'techstart-inc',
      clerkOrgId: 'org_mock_techstart_456',
      status: 'ACTIVE',
    },
  })
  console.log('Created clients:', acme.name, ',', techstart.name)

  // ────────────────────────────────────────────────────
  // Client Users
  // ────────────────────────────────────────────────────
  const acmeAdmin = await prisma.clientUser.create({
    data: {
      clerkUserId: 'user_mock_acme_admin_001',
      clientId: acme.id,
      role: 'CLIENT_ADMIN',
    },
  })

  const acmeUser = await prisma.clientUser.create({
    data: {
      clerkUserId: 'user_mock_acme_user_002',
      clientId: acme.id,
      role: 'CLIENT_USER',
    },
  })

  const acmeViewer = await prisma.clientUser.create({
    data: {
      clerkUserId: 'user_mock_acme_viewer_003',
      clientId: acme.id,
      role: 'CLIENT_VIEWER',
    },
  })

  const techstartAdmin = await prisma.clientUser.create({
    data: {
      clerkUserId: 'user_mock_ts_admin_001',
      clientId: techstart.id,
      role: 'CLIENT_ADMIN',
    },
  })

  const techstartUser = await prisma.clientUser.create({
    data: {
      clerkUserId: 'user_mock_ts_user_002',
      clientId: techstart.id,
      role: 'CLIENT_USER',
    },
  })
  console.log('Created client users:', acmeAdmin.id, acmeUser.id, acmeViewer.id, techstartAdmin.id, techstartUser.id)

  // ────────────────────────────────────────────────────
  // Tags (shared across ideas)
  // ────────────────────────────────────────────────────
  const tagUX = await prisma.tag.create({ data: { name: 'ux' } })
  const tagPerformance = await prisma.tag.create({ data: { name: 'performance' } })
  const tagSecurity = await prisma.tag.create({ data: { name: 'security' } })
  const tagIntegration = await prisma.tag.create({ data: { name: 'integration' } })
  const tagMobile = await prisma.tag.create({ data: { name: 'mobile' } })
  const tagAPI = await prisma.tag.create({ data: { name: 'api' } })
  const tagAnalytics = await prisma.tag.create({ data: { name: 'analytics' } })
  const tagOnboarding = await prisma.tag.create({ data: { name: 'onboarding' } })
  console.log('Created tags:', tagUX.name, tagPerformance.name, tagSecurity.name, tagIntegration.name, tagMobile.name, tagAPI.name, tagAnalytics.name, tagOnboarding.name)

  // ────────────────────────────────────────────────────
  // Acme Corp — Products
  // ────────────────────────────────────────────────────
  const acmeWebApp = await prisma.product.create({
    data: {
      name: 'Acme Web App',
      description: 'Core web application for Acme customers',
      vision: 'Become the leading platform for widget management',
      strategy: 'Focus on ease-of-use and enterprise integrations',
      status: 'ACTIVE',
      color: '#3B82F6',
      icon: 'globe',
      clientId: acme.id,
    },
  })

  const acmeMobileApp = await prisma.product.create({
    data: {
      name: 'Acme Mobile',
      description: 'Mobile companion app for on-the-go access',
      vision: 'Full feature parity with web on mobile devices',
      status: 'ACTIVE',
      color: '#10B981',
      icon: 'smartphone',
      clientId: acme.id,
    },
  })

  const acmeAPI = await prisma.product.create({
    data: {
      name: 'Acme Developer API',
      description: 'Public REST and GraphQL API for third-party integrations',
      status: 'DRAFT',
      color: '#F59E0B',
      icon: 'code',
      clientId: acme.id,
    },
  })
  console.log('Created Acme products:', acmeWebApp.name, ',', acmeMobileApp.name, ',', acmeAPI.name)

  // ────────────────────────────────────────────────────
  // Acme Corp — Product Members
  // ────────────────────────────────────────────────────
  await prisma.productMember.create({
    data: {
      productId: acmeWebApp.id,
      clerkUserId: 'user_mock_acme_admin_001',
      role: 'LEAD',
      clientId: acme.id,
    },
  })
  await prisma.productMember.create({
    data: {
      productId: acmeWebApp.id,
      clerkUserId: 'user_mock_acme_user_002',
      role: 'MEMBER',
      clientId: acme.id,
    },
  })
  await prisma.productMember.create({
    data: {
      productId: acmeMobileApp.id,
      clerkUserId: 'user_mock_acme_user_002',
      role: 'LEAD',
      clientId: acme.id,
    },
  })
  await prisma.productMember.create({
    data: {
      productId: acmeAPI.id,
      clerkUserId: 'user_mock_acme_admin_001',
      role: 'LEAD',
      clientId: acme.id,
    },
  })
  console.log('Created Acme product members')

  // ────────────────────────────────────────────────────
  // Acme Corp — Ideas
  // ────────────────────────────────────────────────────
  const acmeIdea1 = await prisma.idea.create({
    data: {
      title: 'Add dark mode support',
      description: 'Users have been requesting dark mode. This would reduce eye strain and improve the experience for night-time users.',
      status: 'PLANNED',
      clientId: acme.id,
      productId: acmeWebApp.id,
      authorId: 'user_mock_acme_user_002',
      riceReach: 5000,
      riceImpact: 2,
      riceConfidence: 0.8,
      riceEffort: 3,
      riceScore: 2666.67,
      votes: 47,
      tags: { connect: [{ id: tagUX.id }] },
    },
  })

  const acmeIdea2 = await prisma.idea.create({
    data: {
      title: 'Real-time collaboration',
      description: 'Allow multiple users to edit widgets simultaneously with live cursors and conflict resolution.',
      status: 'UNDER_REVIEW',
      clientId: acme.id,
      productId: acmeWebApp.id,
      authorId: 'user_mock_acme_admin_001',
      riceReach: 3000,
      riceImpact: 3,
      riceConfidence: 0.6,
      riceEffort: 8,
      riceScore: 675.0,
      votes: 32,
      tags: { connect: [{ id: tagUX.id }, { id: tagPerformance.id }] },
    },
  })

  const acmeIdea3 = await prisma.idea.create({
    data: {
      title: 'Keyboard shortcuts for power users',
      description: 'Implement comprehensive keyboard shortcuts for all common actions to speed up workflows.',
      status: 'SUBMITTED',
      clientId: acme.id,
      productId: acmeWebApp.id,
      authorId: 'user_mock_acme_viewer_003',
      votes: 18,
      tags: { connect: [{ id: tagUX.id }] },
    },
  })

  const acmeIdea4 = await prisma.idea.create({
    data: {
      title: 'Offline mode for mobile',
      description: 'Support offline access with automatic sync when connectivity is restored.',
      status: 'IN_PROGRESS',
      clientId: acme.id,
      productId: acmeMobileApp.id,
      authorId: 'user_mock_acme_user_002',
      riceReach: 2000,
      riceImpact: 3,
      riceConfidence: 0.7,
      riceEffort: 5,
      riceScore: 840.0,
      votes: 25,
      tags: { connect: [{ id: tagMobile.id }, { id: tagPerformance.id }] },
    },
  })

  const acmeIdea5 = await prisma.idea.create({
    data: {
      title: 'REST API rate limiting dashboard',
      description: 'Provide developers with a visual dashboard showing their API usage and rate limit status.',
      status: 'SUBMITTED',
      clientId: acme.id,
      productId: acmeAPI.id,
      authorId: 'user_mock_acme_admin_001',
      votes: 8,
      tags: { connect: [{ id: tagAPI.id }, { id: tagAnalytics.id }] },
    },
  })
  console.log('Created Acme ideas:', acmeIdea1.title, ',', acmeIdea2.title, ',', acmeIdea3.title, ',', acmeIdea4.title, ',', acmeIdea5.title)

  // ────────────────────────────────────────────────────
  // Acme Corp — Roadmaps
  // ────────────────────────────────────────────────────
  const acmeQ1Roadmap = await prisma.roadmap.create({
    data: {
      name: 'Q1 2026 Web App Roadmap',
      description: 'Major initiatives for the web application in Q1 2026',
      clientId: acme.id,
      productId: acmeWebApp.id,
      isPublic: false,
    },
  })

  const acmeMobileRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Mobile App v2.0 Roadmap',
      description: 'Feature roadmap for the next major mobile release',
      clientId: acme.id,
      productId: acmeMobileApp.id,
      isPublic: true,
    },
  })
  console.log('Created Acme roadmaps:', acmeQ1Roadmap.name, ',', acmeMobileRoadmap.name)

  // ────────────────────────────────────────────────────
  // Acme Corp — Releases
  // ────────────────────────────────────────────────────
  const acmeRelease1 = await prisma.release.create({
    data: {
      name: 'v3.1.0',
      description: 'Dark mode and UX improvements',
      targetDate: new Date('2026-02-15'),
      status: 'IN_PROGRESS',
      roadmapId: acmeQ1Roadmap.id,
    },
  })

  const acmeRelease2 = await prisma.release.create({
    data: {
      name: 'v3.2.0',
      description: 'Collaboration features',
      targetDate: new Date('2026-03-30'),
      status: 'PLANNED',
      roadmapId: acmeQ1Roadmap.id,
    },
  })

  const acmeMobileRelease = await prisma.release.create({
    data: {
      name: 'v2.0.0',
      description: 'Major mobile release with offline support',
      targetDate: new Date('2026-04-01'),
      status: 'PLANNED',
      roadmapId: acmeMobileRoadmap.id,
    },
  })
  console.log('Created Acme releases:', acmeRelease1.name, ',', acmeRelease2.name, ',', acmeMobileRelease.name)

  // ────────────────────────────────────────────────────
  // Acme Corp — Roadmap Items
  // ────────────────────────────────────────────────────
  await prisma.roadmapItem.create({
    data: {
      title: 'Implement dark mode theme tokens',
      description: 'Define OKLCH color tokens for dark theme and wire up the toggle.',
      status: 'IN_PROGRESS',
      priority: 1,
      roadmapId: acmeQ1Roadmap.id,
      releaseId: acmeRelease1.id,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-02-01'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Dark mode component audit',
      description: 'Audit all Shadcn components for dark mode compatibility.',
      status: 'COMPLETED',
      priority: 2,
      roadmapId: acmeQ1Roadmap.id,
      releaseId: acmeRelease1.id,
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-01-14'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Real-time collaboration engine',
      description: 'Build the WebSocket-based collaboration backend with CRDT support.',
      status: 'BACKLOG',
      priority: 1,
      roadmapId: acmeQ1Roadmap.id,
      releaseId: acmeRelease2.id,
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Live cursor rendering',
      description: 'Show other users cursors in real-time during editing.',
      status: 'BACKLOG',
      priority: 2,
      roadmapId: acmeQ1Roadmap.id,
      releaseId: acmeRelease2.id,
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Offline data sync engine',
      description: 'Implement local-first storage with background sync.',
      status: 'PLANNED',
      priority: 1,
      roadmapId: acmeMobileRoadmap.id,
      releaseId: acmeMobileRelease.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-15'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Push notification overhaul',
      description: 'Redesign push notification system with user preference controls.',
      status: 'BACKLOG',
      priority: 3,
      roadmapId: acmeMobileRoadmap.id,
    },
  })
  console.log('Created Acme roadmap items')

  // ────────────────────────────────────────────────────
  // Acme Corp — Issues
  // ────────────────────────────────────────────────────
  const acmeIssue1 = await prisma.issue.create({
    data: {
      title: 'Dashboard charts fail to render on Safari 17',
      description: 'The analytics dashboard charts show a blank canvas on Safari 17. Error in console: "ResizeObserver loop completed with undelivered notifications." Affects approximately 15% of our user base.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      clientId: acme.id,
      productId: acmeWebApp.id,
      reporterId: 'user_mock_acme_user_002',
      assigneeId: 'user_mock_acme_admin_001',
      customersAffected: 340,
    },
  })

  const acmeIssue2 = await prisma.issue.create({
    data: {
      title: 'Export to CSV produces corrupted UTF-8 characters',
      description: 'When exporting data with special characters (accents, CJK) to CSV, the output file has garbled encoding. Users report this on Windows machines primarily.',
      severity: 'MEDIUM',
      status: 'OPEN',
      clientId: acme.id,
      productId: acmeWebApp.id,
      reporterId: 'user_mock_acme_viewer_003',
      customersAffected: 85,
    },
  })

  const acmeIssue3 = await prisma.issue.create({
    data: {
      title: 'App crashes on Android 12 when opening camera',
      description: 'The barcode scanning feature crashes the app immediately on Android 12 devices. Logcat shows a permission-related crash in the camera library.',
      severity: 'CRITICAL',
      status: 'OPEN',
      clientId: acme.id,
      productId: acmeMobileApp.id,
      reporterId: 'user_mock_acme_admin_001',
      assigneeId: 'user_mock_acme_user_002',
      customersAffected: 520,
    },
  })

  const acmeIssue4 = await prisma.issue.create({
    data: {
      title: 'Slow page load on product listing page',
      description: 'The product listing page takes over 4 seconds to load when there are more than 500 items. Need to implement pagination or virtual scrolling.',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      clientId: acme.id,
      productId: acmeWebApp.id,
      reporterId: 'user_mock_acme_user_002',
      assigneeId: 'user_mock_acme_admin_001',
      customersAffected: 200,
    },
  })
  console.log('Created Acme issues:', acmeIssue1.title, ',', acmeIssue2.title, ',', acmeIssue3.title, ',', acmeIssue4.title)

  // ────────────────────────────────────────────────────
  // Acme Corp — Goals
  // ────────────────────────────────────────────────────
  await prisma.goal.create({
    data: {
      title: 'Reach 10,000 monthly active users',
      description: 'Grow MAU from current 6,500 to 10,000 by end of Q2 2026.',
      targetValue: 10000,
      currentValue: 6500,
      productId: acmeWebApp.id,
    },
  })

  await prisma.goal.create({
    data: {
      title: 'Reduce average page load time to under 1.5s',
      description: 'Optimize Core Web Vitals across all major pages.',
      targetValue: 1.5,
      currentValue: 2.8,
      productId: acmeWebApp.id,
    },
  })

  await prisma.goal.create({
    data: {
      title: 'Achieve 4.5 star rating on App Store',
      description: 'Improve app store rating from 3.9 to 4.5 through bug fixes and UX improvements.',
      targetValue: 4.5,
      currentValue: 3.9,
      productId: acmeMobileApp.id,
    },
  })
  console.log('Created Acme goals')

  // ────────────────────────────────────────────────────
  // Acme Corp — Custom Fields
  // ────────────────────────────────────────────────────
  await prisma.customField.create({
    data: {
      name: 'Customer Segment',
      fieldType: 'select',
      options: ['Enterprise', 'SMB', 'Startup', 'Individual'],
      productId: acmeWebApp.id,
    },
  })

  await prisma.customField.create({
    data: {
      name: 'Estimated Revenue Impact',
      fieldType: 'number',
      productId: acmeWebApp.id,
    },
  })

  await prisma.customField.create({
    data: {
      name: 'Platform',
      fieldType: 'select',
      options: ['iOS', 'Android', 'Both'],
      productId: acmeMobileApp.id,
    },
  })
  console.log('Created Acme custom fields')

  // ────────────────────────────────────────────────────
  // Acme Corp — Comments
  // ────────────────────────────────────────────────────
  await prisma.comment.create({
    data: {
      content: 'This is a must-have for accessibility. Many users have mentioned this in support tickets.',
      authorId: 'user_mock_acme_admin_001',
      ideaId: acmeIdea1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'We should use OKLCH color tokens from the start so the theme is consistent.',
      authorId: 'user_mock_acme_user_002',
      ideaId: acmeIdea1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Have we considered using Yjs or Automerge for the CRDT layer?',
      authorId: 'user_mock_acme_user_002',
      ideaId: acmeIdea2.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'I can reproduce this consistently on Safari 17.2. Downgrading the chart library to v3.8 seems to fix it temporarily.',
      authorId: 'user_mock_acme_user_002',
      issueId: acmeIssue1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Root cause identified: the ResizeObserver polyfill conflicts with Safari native implementation. Working on a fix.',
      authorId: 'user_mock_acme_admin_001',
      issueId: acmeIssue1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Confirmed this is a permissions issue. Android 12 changed the camera permission model. Need to update the manifest.',
      authorId: 'user_mock_acme_user_002',
      issueId: acmeIssue3.id,
    },
  })
  console.log('Created Acme comments')

  // ════════════════════════════════════════════════════
  // TechStart Inc — Products
  // ════════════════════════════════════════════════════
  const tsAnalytics = await prisma.product.create({
    data: {
      name: 'Analytics Dashboard',
      description: 'Real-time analytics platform for SaaS metrics',
      vision: 'The go-to analytics solution for early-stage startups',
      strategy: 'Ship fast, iterate on customer feedback, focus on time-to-insight',
      status: 'ACTIVE',
      color: '#8B5CF6',
      icon: 'bar-chart',
      clientId: techstart.id,
    },
  })

  const tsOnboarding = await prisma.product.create({
    data: {
      name: 'User Onboarding Suite',
      description: 'Guided onboarding flows and checklists for new users',
      status: 'ACTIVE',
      color: '#EC4899',
      icon: 'users',
      clientId: techstart.id,
    },
  })
  console.log('Created TechStart products:', tsAnalytics.name, ',', tsOnboarding.name)

  // ────────────────────────────────────────────────────
  // TechStart Inc — Product Members
  // ────────────────────────────────────────────────────
  await prisma.productMember.create({
    data: {
      productId: tsAnalytics.id,
      clerkUserId: 'user_mock_ts_admin_001',
      role: 'LEAD',
      clientId: techstart.id,
    },
  })

  await prisma.productMember.create({
    data: {
      productId: tsAnalytics.id,
      clerkUserId: 'user_mock_ts_user_002',
      role: 'MEMBER',
      clientId: techstart.id,
    },
  })

  await prisma.productMember.create({
    data: {
      productId: tsOnboarding.id,
      clerkUserId: 'user_mock_ts_user_002',
      role: 'LEAD',
      clientId: techstart.id,
    },
  })
  console.log('Created TechStart product members')

  // ────────────────────────────────────────────────────
  // TechStart Inc — Ideas
  // ────────────────────────────────────────────────────
  const tsIdea1 = await prisma.idea.create({
    data: {
      title: 'Funnel visualization widget',
      description: 'Add a drag-and-drop funnel chart widget that lets users define conversion steps and visualize drop-offs at each stage.',
      status: 'PLANNED',
      clientId: techstart.id,
      productId: tsAnalytics.id,
      authorId: 'user_mock_ts_admin_001',
      riceReach: 4000,
      riceImpact: 3,
      riceConfidence: 0.9,
      riceEffort: 4,
      riceScore: 2700.0,
      votes: 56,
      tags: { connect: [{ id: tagAnalytics.id }, { id: tagUX.id }] },
    },
  })

  const tsIdea2 = await prisma.idea.create({
    data: {
      title: 'Slack integration for alerts',
      description: 'Send metric alerts and weekly digest summaries to Slack channels.',
      status: 'IN_PROGRESS',
      clientId: techstart.id,
      productId: tsAnalytics.id,
      authorId: 'user_mock_ts_user_002',
      riceReach: 3500,
      riceImpact: 2,
      riceConfidence: 0.85,
      riceEffort: 2,
      riceScore: 2975.0,
      votes: 41,
      tags: { connect: [{ id: tagIntegration.id }] },
    },
  })

  const tsIdea3 = await prisma.idea.create({
    data: {
      title: 'Interactive onboarding flow builder',
      description: 'A visual drag-and-drop builder for creating multi-step onboarding flows with conditional branching.',
      status: 'UNDER_REVIEW',
      clientId: techstart.id,
      productId: tsOnboarding.id,
      authorId: 'user_mock_ts_admin_001',
      riceReach: 2500,
      riceImpact: 3,
      riceConfidence: 0.7,
      riceEffort: 6,
      riceScore: 875.0,
      votes: 29,
      tags: { connect: [{ id: tagUX.id }, { id: tagOnboarding.id }] },
    },
  })

  const tsIdea4 = await prisma.idea.create({
    data: {
      title: 'A/B testing for onboarding flows',
      description: 'Allow users to run A/B tests on different onboarding sequences and measure completion rates.',
      status: 'SUBMITTED',
      clientId: techstart.id,
      productId: tsOnboarding.id,
      authorId: 'user_mock_ts_user_002',
      votes: 15,
      tags: { connect: [{ id: tagAnalytics.id }, { id: tagOnboarding.id }] },
    },
  })
  console.log('Created TechStart ideas:', tsIdea1.title, ',', tsIdea2.title, ',', tsIdea3.title, ',', tsIdea4.title)

  // ────────────────────────────────────────────────────
  // TechStart Inc — Roadmaps
  // ────────────────────────────────────────────────────
  const tsRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Analytics Platform H1 2026',
      description: 'Feature roadmap for the analytics dashboard through June 2026',
      clientId: techstart.id,
      productId: tsAnalytics.id,
      isPublic: true,
    },
  })

  const tsOnboardingRoadmap = await prisma.roadmap.create({
    data: {
      name: 'Onboarding Suite Q1 2026',
      description: 'Initial launch features for the onboarding product',
      clientId: techstart.id,
      productId: tsOnboarding.id,
      isPublic: false,
    },
  })
  console.log('Created TechStart roadmaps:', tsRoadmap.name, ',', tsOnboardingRoadmap.name)

  // ────────────────────────────────────────────────────
  // TechStart Inc — Releases
  // ────────────────────────────────────────────────────
  const tsRelease1 = await prisma.release.create({
    data: {
      name: 'v1.5.0',
      description: 'Funnel charts and Slack integration',
      targetDate: new Date('2026-03-01'),
      status: 'IN_PROGRESS',
      roadmapId: tsRoadmap.id,
    },
  })

  const tsRelease2 = await prisma.release.create({
    data: {
      name: 'v2.0.0',
      description: 'Custom dashboards and advanced filtering',
      targetDate: new Date('2026-06-01'),
      status: 'PLANNED',
      roadmapId: tsRoadmap.id,
    },
  })

  const tsOnboardingRelease = await prisma.release.create({
    data: {
      name: 'v1.0.0',
      description: 'Initial release of onboarding suite',
      targetDate: new Date('2026-03-15'),
      status: 'PLANNED',
      roadmapId: tsOnboardingRoadmap.id,
    },
  })
  console.log('Created TechStart releases:', tsRelease1.name, ',', tsRelease2.name, ',', tsOnboardingRelease.name)

  // ────────────────────────────────────────────────────
  // TechStart Inc — Roadmap Items
  // ────────────────────────────────────────────────────
  await prisma.roadmapItem.create({
    data: {
      title: 'Build funnel chart component',
      description: 'Create a reusable D3-based funnel visualization component.',
      status: 'IN_PROGRESS',
      priority: 1,
      roadmapId: tsRoadmap.id,
      releaseId: tsRelease1.id,
      startDate: new Date('2026-01-20'),
      endDate: new Date('2026-02-15'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Slack webhook integration',
      description: 'Implement outgoing webhooks to Slack with configurable alert rules.',
      status: 'IN_PROGRESS',
      priority: 2,
      roadmapId: tsRoadmap.id,
      releaseId: tsRelease1.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Custom dashboard builder',
      description: 'Drag-and-drop dashboard editor with widget library.',
      status: 'BACKLOG',
      priority: 1,
      roadmapId: tsRoadmap.id,
      releaseId: tsRelease2.id,
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Advanced query filter builder',
      description: 'Visual filter builder for creating complex data queries without SQL.',
      status: 'BACKLOG',
      priority: 2,
      roadmapId: tsRoadmap.id,
      releaseId: tsRelease2.id,
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Checklist component',
      description: 'Build the core onboarding checklist UI component with progress tracking.',
      status: 'PLANNED',
      priority: 1,
      roadmapId: tsOnboardingRoadmap.id,
      releaseId: tsOnboardingRelease.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
    },
  })

  await prisma.roadmapItem.create({
    data: {
      title: 'Tooltip and hotspot system',
      description: 'Contextual tooltips and interactive hotspots for in-app guidance.',
      status: 'BACKLOG',
      priority: 2,
      roadmapId: tsOnboardingRoadmap.id,
      releaseId: tsOnboardingRelease.id,
    },
  })
  console.log('Created TechStart roadmap items')

  // ────────────────────────────────────────────────────
  // TechStart Inc — Issues
  // ────────────────────────────────────────────────────
  const tsIssue1 = await prisma.issue.create({
    data: {
      title: 'Memory leak in real-time data stream',
      description: 'The WebSocket connection for live data updates causes a gradual memory increase. After ~4 hours the tab becomes unresponsive. Heap snapshot shows detached DOM nodes from chart re-renders.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      clientId: techstart.id,
      productId: tsAnalytics.id,
      reporterId: 'user_mock_ts_user_002',
      assigneeId: 'user_mock_ts_admin_001',
      customersAffected: 150,
    },
  })

  const tsIssue2 = await prisma.issue.create({
    data: {
      title: 'Date range picker timezone mismatch',
      description: 'Users in non-UTC timezones see data shifted by their UTC offset. The date range picker sends local time but the backend expects UTC.',
      severity: 'MEDIUM',
      status: 'OPEN',
      clientId: techstart.id,
      productId: tsAnalytics.id,
      reporterId: 'user_mock_ts_admin_001',
      customersAffected: 300,
    },
  })

  const tsIssue3 = await prisma.issue.create({
    data: {
      title: 'Onboarding checklist does not persist dismiss state',
      description: 'When a user dismisses the onboarding checklist and refreshes the page, the checklist reappears. The dismiss state is only stored in component state, not persisted.',
      severity: 'LOW',
      status: 'OPEN',
      clientId: techstart.id,
      productId: tsOnboarding.id,
      reporterId: 'user_mock_ts_user_002',
      customersAffected: 45,
    },
  })
  console.log('Created TechStart issues:', tsIssue1.title, ',', tsIssue2.title, ',', tsIssue3.title)

  // ────────────────────────────────────────────────────
  // TechStart Inc — Goals
  // ────────────────────────────────────────────────────
  await prisma.goal.create({
    data: {
      title: 'Reach 500 paying customers',
      description: 'Grow from 180 to 500 paid subscriptions by end of H1 2026.',
      targetValue: 500,
      currentValue: 180,
      productId: tsAnalytics.id,
    },
  })

  await prisma.goal.create({
    data: {
      title: '95th percentile query time under 200ms',
      description: 'Optimize analytics queries so the p95 latency is below 200ms.',
      targetValue: 200,
      currentValue: 450,
      productId: tsAnalytics.id,
    },
  })

  await prisma.goal.create({
    data: {
      title: '80% onboarding completion rate',
      description: 'Increase onboarding flow completion from 52% to 80%.',
      targetValue: 80,
      currentValue: 52,
      productId: tsOnboarding.id,
    },
  })
  console.log('Created TechStart goals')

  // ────────────────────────────────────────────────────
  // TechStart Inc — Custom Fields
  // ────────────────────────────────────────────────────
  await prisma.customField.create({
    data: {
      name: 'Data Source Type',
      fieldType: 'select',
      options: ['PostgreSQL', 'MySQL', 'BigQuery', 'Snowflake', 'REST API'],
      productId: tsAnalytics.id,
    },
  })

  await prisma.customField.create({
    data: {
      name: 'Expected Query Volume',
      fieldType: 'number',
      productId: tsAnalytics.id,
    },
  })

  await prisma.customField.create({
    data: {
      name: 'Target User Segment',
      fieldType: 'select',
      options: ['New Users', 'Trial Users', 'Returning Users', 'Enterprise'],
      productId: tsOnboarding.id,
    },
  })
  console.log('Created TechStart custom fields')

  // ────────────────────────────────────────────────────
  // TechStart Inc — Comments
  // ────────────────────────────────────────────────────
  await prisma.comment.create({
    data: {
      content: 'This is our most requested feature. I think we should prioritize this over the custom dashboards.',
      authorId: 'user_mock_ts_admin_001',
      ideaId: tsIdea1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'We should also support Microsoft Teams, not just Slack. Many enterprise customers use Teams.',
      authorId: 'user_mock_ts_user_002',
      ideaId: tsIdea2.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'The branching logic is critical. We need to support conditions based on user properties and actions.',
      authorId: 'user_mock_ts_admin_001',
      ideaId: tsIdea3.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Profiled this with Chrome DevTools. The leak is in the chart library subscription cleanup. Working on a fix using useEffect cleanup.',
      authorId: 'user_mock_ts_admin_001',
      issueId: tsIssue1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'This also affects the scheduled email reports. The date range in emails is wrong for non-UTC users.',
      authorId: 'user_mock_ts_user_002',
      issueId: tsIssue2.id,
    },
  })
  console.log('Created TechStart comments')

  // ────────────────────────────────────────────────────
  // Done
  // ────────────────────────────────────────────────────
  console.log('')
  console.log('Seeding complete!')
  console.log('  - 1 Super Admin')
  console.log('  - 2 Clients (Acme Corp, TechStart Inc)')
  console.log('  - 5 Client Users')
  console.log('  - 5 Products')
  console.log('  - 7 Product Members')
  console.log('  - 9 Ideas')
  console.log('  - 4 Roadmaps')
  console.log('  - 6 Releases')
  console.log('  - 12 Roadmap Items')
  console.log('  - 7 Issues')
  console.log('  - 6 Goals')
  console.log('  - 6 Custom Fields')
  console.log('  - 8 Tags')
  console.log('  - 11 Comments')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
