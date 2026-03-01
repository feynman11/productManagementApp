import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { prisma } from './prisma'

export async function requireAuth() {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) throw new Error('Not authenticated')
  return { userId, orgId, orgRole }
}

export async function requireClientAuth() {
  const { userId, orgId, orgRole } = await requireAuth()
  if (!orgId) throw new Error('No organization selected')

  let client = await prisma.client.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, status: true },
  })

  // Auto-provision Client if Clerk org exists but DB record doesn't yet
  // (handles webhook race condition and local dev without tunnel)
  if (!client) {
    const clerkOrg = await clerkClient().organizations.getOrganization({
      organizationId: orgId,
    })

    client = await prisma.client.create({
      data: {
        name: clerkOrg.name,
        slug: clerkOrg.slug!,
        clerkOrgId: orgId,
        status: 'ACTIVE',
      },
      select: { id: true, status: true },
    })
  }

  if (client.status !== 'ACTIVE') {
    throw new Error('Client not found or inactive')
  }

  // Auto-provision ClientUser if missing
  let clientUser = await prisma.clientUser.findUnique({
    where: {
      clerkUserId_clientId: { clerkUserId: userId, clientId: client.id },
    },
    select: { role: true },
  })

  if (!clientUser) {
    const role = mapClerkRole(orgRole)
    clientUser = await prisma.clientUser.create({
      data: {
        clerkUserId: userId,
        clientId: client.id,
        role,
      },
      select: { role: true },
    })
  }

  return {
    userId,
    orgId,
    orgRole,
    clientId: client.id,
    clientUserRole: clientUser.role,
  }
}

function mapClerkRole(
  clerkRole: string | undefined,
): 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_VIEWER' {
  switch (clerkRole) {
    case 'org:admin':
      return 'CLIENT_ADMIN'
    case 'org:member':
      return 'CLIENT_USER'
    default:
      return 'CLIENT_VIEWER'
  }
}

export async function requireSuperAdmin() {
  // Super admin auth is separate from Clerk
  // This will be implemented with session/token-based auth
  // For now, throw an error as placeholder
  throw new Error('Super admin auth not yet implemented')
}
