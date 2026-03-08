import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { prisma } from '~/lib/prisma'

/**
 * Fetch basic Clerk auth state for the root route.
 */
export const fetchClerkAuth = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { userId } = await auth()
    return { userId }
  })

/**
 * Get the demo org slug (if one exists). Does not require authentication.
 */
export const getDemoOrgSlug = createServerFn({ method: 'GET' })
  .handler(async () => {
    const demoOrg = await prisma.client.findFirst({
      where: { isDemo: true, status: 'ACTIVE' },
      select: { slug: true },
    })
    return { slug: demoOrg?.slug ?? null }
  })

/**
 * Get the current user's app context (orgs, active org, super admin status).
 * Auto-provisions AppUser on first login. First user becomes super admin.
 */
export const getUserContext = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return { authenticated: false as const }

    let appUser = await prisma.appUser.findUnique({
      where: { clerkUserId },
      include: {
        memberships: {
          include: { client: { select: { id: true, name: true, slug: true, status: true, isDemo: true } } },
        },
        activeClient: { select: { id: true, slug: true } },
      },
    })

    if (!appUser) {
      const isFirst = (await prisma.appUser.count()) === 0
      appUser = await prisma.appUser.create({
        data: { clerkUserId, isSuperAdmin: isFirst },
        include: {
          memberships: {
            include: { client: { select: { id: true, name: true, slug: true, status: true, isDemo: true } } },
          },
          activeClient: { select: { id: true, slug: true } },
        },
      })
    }

    // Include demo org in accessible orgs even without membership
    const demoOrg = await prisma.client.findFirst({
      where: { isDemo: true, status: 'ACTIVE' },
      select: { id: true, name: true, slug: true, status: true, isDemo: true },
    })

    const memberOrgs = appUser.memberships
      .filter(m => m.client.status === 'ACTIVE')
      .map(m => ({ ...m.client, role: m.role }))

    // Add demo org if not already a member
    const orgs = demoOrg && !memberOrgs.some(o => o.id === demoOrg.id)
      ? [{ ...demoOrg, role: 'VIEWER' as const }, ...memberOrgs]
      : memberOrgs

    return {
      authenticated: true as const,
      appUserId: appUser.id,
      isSuperAdmin: appUser.isSuperAdmin,
      activeOrgSlug: appUser.activeClient?.slug ?? null,
      orgs,
    }
  })
