import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { getCookie, setCookie } from '@tanstack/start-server-core'
import { prisma } from './prisma'
import type { OrgRole, ProductMemberRole } from '../generated/prisma/client/enums'
import { resolveProductRole, type EffectiveProductRole } from './permissions'

const GUEST_DEMO_COOKIE = 'guest_demo_client_id'
/** Sentinel userId returned for unauthenticated guest demo access. */
const GUEST_USER_ID = '__guest__'

/**
 * Basic Clerk auth — returns userId only.
 */
async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')
  return { userId }
}

/**
 * Optional Clerk auth — returns userId or null (does not throw).
 */
async function optionalAuth() {
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
    const publicMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>
    return { name, email, avatarUrl, publicMetadata }
  } catch {
    return { name: null, email: null, avatarUrl: null, publicMetadata: null }
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

  let publicMetadata: Record<string, unknown> | null = null

  if (!appUser) {
    const isFirst = (await prisma.appUser.count()) === 0
    const profile = await fetchClerkProfile(clerkUserId)
    publicMetadata = profile.publicMetadata
    appUser = await prisma.appUser.create({
      data: { clerkUserId, isSuperAdmin: isFirst, name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl },
    })
  } else if (!appUser.name || !appUser.email || !appUser.avatarUrl) {
    const profile = await fetchClerkProfile(clerkUserId)
    publicMetadata = profile.publicMetadata
    if (profile.name || profile.email || profile.avatarUrl) {
      appUser = await prisma.appUser.update({
        where: { id: appUser.id },
        data: {
          ...(profile.name && !appUser.name ? { name: profile.name } : {}),
          ...(profile.email && !appUser.email ? { email: profile.email } : {}),
          ...(profile.avatarUrl && !appUser.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        },
      })
    }
  }

  // Process pending invitation metadata from Clerk
  await processPendingInvitations(clerkUserId, appUser.id, publicMetadata)

  return appUser
}

/**
 * Process pending invitation metadata from Clerk publicMetadata.
 * Auto-creates ClientUser records for any pending org invitations.
 */
async function processPendingInvitations(
  clerkUserId: string,
  appUserId: string,
  publicMetadata: Record<string, unknown> | null,
) {
  try {
    // If we didn't fetch metadata yet (profile was already complete), fetch it now
    if (publicMetadata === null) {
      const profile = await fetchClerkProfile(clerkUserId)
      publicMetadata = profile.publicMetadata
    }
    if (!publicMetadata) return

    const pending = publicMetadata.pendingInvitations as Array<{
      clientId: string
      role: 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'
      products?: Array<{ productId: string; role: 'OWNER' | 'MEMBER' | 'VIEWER' }>
    }> | undefined

    if (!pending || pending.length === 0) return

    let setActiveClient = false

    for (const inv of pending) {
      // Verify org exists and is active
      const client = await prisma.client.findUnique({
        where: { id: inv.clientId },
        select: { id: true, status: true, isDemo: true },
      })
      if (!client || client.status !== 'ACTIVE' || client.isDemo) continue

      // Skip if already a member (idempotent)
      const existing = await prisma.clientUser.findUnique({
        where: { userId_clientId: { userId: appUserId, clientId: inv.clientId } },
      })
      if (existing) continue

      await prisma.clientUser.create({
        data: {
          userId: appUserId,
          clientId: inv.clientId,
          role: inv.role,
        },
      })

      // Add to products
      if (inv.products) {
        for (const pa of inv.products) {
          const existingMember = await prisma.productMember.findUnique({
            where: { productId_userId: { productId: pa.productId, userId: appUserId } },
          })
          if (!existingMember) {
            await prisma.productMember.create({
              data: {
                productId: pa.productId,
                userId: appUserId,
                clientId: inv.clientId,
                role: pa.role,
              },
            })
          }
        }
      }

      if (!setActiveClient) {
        // Set the first invited org as the active org if user has none
        const user = await prisma.appUser.findUnique({ where: { id: appUserId }, select: { activeClientId: true } })
        if (!user?.activeClientId) {
          await prisma.appUser.update({ where: { id: appUserId }, data: { activeClientId: inv.clientId } })
          setActiveClient = true
        }
      }
    }

    // Clear pending invitations from Clerk metadata
    const clerk = clerkClient()
    const { pendingInvitations: _, ...restMetadata } = publicMetadata as Record<string, unknown> & { pendingInvitations?: unknown }
    await clerk.users.updateUser(clerkUserId, { publicMetadata: restMetadata })
  } catch {
    // Don't block login if invitation processing fails
  }
}

/**
 * Require the current user to be an org admin or super admin.
 */
export async function requireOrgAdmin(clientId: string) {
  const appUser = await requireAppUser()
  if (appUser.isSuperAdmin) return appUser

  const membership = await prisma.clientUser.findUnique({
    where: { userId_clientId: { userId: appUser.id, clientId } },
    select: { role: true },
  })

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Admin access required')
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

/**
 * Product-scoped auth. Resolves both org membership and product-level role.
 * Returns the effective product role (OWNER/MEMBER/VIEWER) accounting for
 * org admin override and super admin status.
 */
export async function requireProductAuth(opts: { productId: string; slug?: string }) {
  const clientAuth = await requireClientAuth({ slug: opts.slug })
  const { userId, clientId, role: orgRole, isDemo, isGuest, appUser } = clientAuth

  // Guests and demo users always get VIEWER
  if (isGuest || isDemo) {
    return {
      ...clientAuth,
      productRole: null as ProductMemberRole | null,
      effectiveProductRole: 'VIEWER' as EffectiveProductRole,
    }
  }

  // Verify product belongs to this org
  const product = await prisma.product.findFirst({
    where: { id: opts.productId, clientId },
    select: { id: true },
  })
  if (!product) throw new Error('Product not found')

  // Look up product membership
  const membership = await prisma.productMember.findUnique({
    where: { productId_userId: { productId: opts.productId, userId } },
    select: { role: true },
  })

  const effectiveProductRole = resolveProductRole({
    orgRole,
    productRole: membership?.role ?? null,
    isSuperAdmin: appUser?.isSuperAdmin ?? false,
    isDemo,
  })

  return {
    ...clientAuth,
    productRole: membership?.role ?? null,
    effectiveProductRole,
  }
}
