import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { prisma } from '~/lib/prisma'
import { requireAppUser } from '~/lib/auth.server'

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

    // Uses shared helper that syncs name/email from Clerk
    const baseUser = await requireAppUser()

    const appUser = await prisma.appUser.findUnique({
      where: { id: baseUser.id },
      include: {
        memberships: {
          include: { client: { select: { id: true, name: true, slug: true, status: true, isDemo: true } } },
        },
        activeClient: { select: { id: true, slug: true } },
      },
    })

    if (!appUser) return { authenticated: false as const }

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
      name: appUser.name,
      isSuperAdmin: appUser.isSuperAdmin,
      activeOrgSlug: appUser.activeClient?.slug ?? null,
      orgs,
    }
  })

/**
 * Update the current user's display name.
 */
export const updateUserName = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const appUser = await requireAppUser()

    // Split into first/last for Clerk
    const parts = data.name.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined

    // Update both AppUser and Clerk in parallel
    await Promise.all([
      prisma.appUser.update({
        where: { id: appUser.id },
        data: { name: data.name },
      }),
      clerkClient().users.updateUser(appUser.clerkUserId, {
        firstName,
        lastName: lastName ?? '',
      }),
    ])

    return { success: true }
  })
