import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { getCookie, setCookie } from '@tanstack/start-server-core'
import { prisma } from './prisma'
import type { OrgRole } from '../generated/prisma/client/enums'

const GUEST_DEMO_COOKIE = 'guest_demo_client_id'
/** Sentinel userId returned for unauthenticated guest demo access. */
export const GUEST_USER_ID = '__guest__'

/**
 * Basic Clerk auth — returns userId only.
 */
export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')
  return { userId }
}

/**
 * Optional Clerk auth — returns userId or null (does not throw).
 */
export async function optionalAuth() {
  const { userId } = await auth()
  return { userId }
}

/**
 * Ensure an AppUser record exists for the authenticated Clerk user.
 * First user to log in becomes super admin.
 */
export async function requireAppUser() {
  const { userId: clerkUserId } = await requireAuth()
  return getOrCreateAppUser(clerkUserId)
}

/**
 * Full org-scoped auth. Resolves the active client from AppUser.activeClientId,
 * from an explicit slug parameter, or from a guest demo cookie.
 *
 * Guest users (unauthenticated) can access demo orgs with VIEWER role.
 * A cookie tracks the demo org for subsequent server function calls.
 */
export async function requireClientAuth(opts?: { slug?: string }) {
  const { userId: clerkUserId } = await optionalAuth()

  let client
  let appUser = null

  if (opts?.slug) {
    // Resolve by slug (works for both authenticated and guest users)
    client = await prisma.client.findUnique({
      where: { slug: opts.slug },
      select: { id: true, status: true, isDemo: true },
    })
  } else if (clerkUserId) {
    // Authenticated user: resolve by activeClientId
    appUser = await getOrCreateAppUser(clerkUserId)
    if (appUser.activeClientId) {
      client = await prisma.client.findUnique({
        where: { id: appUser.activeClientId },
        select: { id: true, status: true, isDemo: true },
      })
    }
  } else {
    // Guest user: try demo cookie
    const guestClientId = getCookie(GUEST_DEMO_COOKIE)
    if (guestClientId) {
      client = await prisma.client.findUnique({
        where: { id: guestClientId },
        select: { id: true, status: true, isDemo: true },
      })
      // Only allow demo orgs via cookie
      if (client && !client.isDemo) client = null
    }
  }

  if (!client) {
    if (!clerkUserId) throw new Error('Not authenticated')
    throw new Error('No organization selected')
  }
  if (client.status !== 'ACTIVE') throw new Error('Organization is not active')

  // Demo org: all users (including guests) get VIEWER access
  if (client.isDemo) {
    // Set cookie so subsequent server function calls can resolve the demo org
    setCookie(GUEST_DEMO_COOKIE, client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    if (clerkUserId) {
      if (!appUser) appUser = await getOrCreateAppUser(clerkUserId)
      return {
        userId: appUser.id,
        clientId: client.id,
        role: 'VIEWER' as OrgRole,
        isDemo: true,
        isGuest: false,
        appUser,
      }
    }

    return {
      userId: GUEST_USER_ID,
      clientId: client.id,
      role: 'VIEWER' as OrgRole,
      isDemo: true,
      isGuest: true,
      appUser: null,
    }
  }

  // Non-demo orgs require authentication
  if (!clerkUserId) throw new Error('Not authenticated')
  if (!appUser) appUser = await getOrCreateAppUser(clerkUserId)

  // Check membership
  const membership = await prisma.clientUser.findUnique({
    where: { userId_clientId: { userId: appUser.id, clientId: client.id } },
    select: { role: true },
  })

  if (!membership) throw new Error('Not a member of this organization')

  return {
    userId: appUser.id,
    clientId: client.id,
    role: membership.role,
    isDemo: false,
    isGuest: false,
    appUser,
  }
}

/**
 * Fetch name and email from Clerk for a given user ID.
 */
async function fetchClerkProfile(clerkUserId: string) {
  try {
    const clerk = clerkClient()
    const user = await clerk.users.getUser(clerkUserId)
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
    const avatarUrl = user.imageUrl || null
    return { name, email, avatarUrl }
  } catch {
    return { name: null, email: null, avatarUrl: null }
  }
}

/**
 * Helper to get or create an AppUser for a Clerk user ID.
 * Syncs name/email from Clerk on creation and when missing.
 */
async function getOrCreateAppUser(clerkUserId: string) {
  let appUser = await prisma.appUser.findUnique({
    where: { clerkUserId },
  })

  if (!appUser) {
    const isFirst = (await prisma.appUser.count()) === 0
    const { name, email, avatarUrl } = await fetchClerkProfile(clerkUserId)
    appUser = await prisma.appUser.create({
      data: { clerkUserId, isSuperAdmin: isFirst, name, email, avatarUrl },
    })
  } else if (!appUser.name || !appUser.email || !appUser.avatarUrl) {
    const { name, email, avatarUrl } = await fetchClerkProfile(clerkUserId)
    if (name || email || avatarUrl) {
      appUser = await prisma.appUser.update({
        where: { id: appUser.id },
        data: {
          ...(name && !appUser.name ? { name } : {}),
          ...(email && !appUser.email ? { email } : {}),
          ...(avatarUrl && !appUser.avatarUrl ? { avatarUrl } : {}),
        },
      })
    }
  }

  return appUser
}

/**
 * Require the current Clerk user to be a super admin.
 */
export async function requireSuperAdmin() {
  const appUser = await requireAppUser()
  if (!appUser.isSuperAdmin) {
    throw new Error('Super admin access required')
  }
  return appUser
}
