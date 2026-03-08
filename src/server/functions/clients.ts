import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireSuperAdmin, requireAppUser } from '~/lib/auth.server'

// ──────────────────────────────────────────────────────
// User Org Functions (any authenticated user)
// ──────────────────────────────────────────────────────

export const getUserOrgs = createServerFn({ method: 'GET' })
  .handler(async () => {
    const appUser = await requireAppUser()

    const memberships = await prisma.clientUser.findMany({
      where: { userId: appUser.id },
      include: {
        client: { select: { id: true, name: true, slug: true, status: true, isDemo: true } },
      },
    })

    const memberOrgs = memberships
      .filter(m => m.client.status === 'ACTIVE')
      .map(m => ({ ...m.client, role: m.role }))

    // Include demo org even without explicit membership
    const demoOrg = await prisma.client.findFirst({
      where: { isDemo: true, status: 'ACTIVE' },
      select: { id: true, name: true, slug: true, status: true, isDemo: true },
    })

    if (demoOrg && !memberOrgs.some(o => o.id === demoOrg.id)) {
      return [{ ...demoOrg, role: 'VIEWER' as const }, ...memberOrgs]
    }

    return memberOrgs
  })

export const switchOrg = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const appUser = await requireAppUser()

    const client = await prisma.client.findUnique({
      where: { slug: data.slug },
      select: { id: true, status: true, isDemo: true },
    })

    if (!client || client.status !== 'ACTIVE') {
      throw new Error('Organization not found')
    }

    // Verify membership (demo org allows all)
    if (!client.isDemo) {
      const membership = await prisma.clientUser.findUnique({
        where: { userId_clientId: { userId: appUser.id, clientId: client.id } },
      })
      if (!membership) throw new Error('Not a member of this organization')
    }

    await prisma.appUser.update({
      where: { id: appUser.id },
      data: { activeClientId: client.id },
    })

    return { success: true }
  })

// ──────────────────────────────────────────────────────
// Super Admin — Client Management
// ──────────────────────────────────────────────────────

export const getClients = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const { page, limit } = data
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { clientUsers: true } } },
      }),
      prisma.client.count(),
    ])
    return { clients, total, page, limit }
  })

export const getClient = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      include: {
        clientUsers: {
          include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
        },
      },
    })
    if (!client) throw new Error('Client not found')
    return client
  })

export const createClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.client.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: 'ACTIVE',
      },
    })
  })

export const updateClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    clientId: z.string(),
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_SETUP', 'SUSPENDED']).optional(),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const { clientId, ...updateData } = data
    return prisma.client.update({
      where: { id: clientId },
      data: updateData,
    })
  })

export const suspendClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.client.update({
      where: { id: data.clientId },
      data: { status: 'SUSPENDED' },
    })
  })

export const activateClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.client.update({
      where: { id: data.clientId },
      data: { status: 'ACTIVE' },
    })
  })

// ──────────────────────────────────────────────────────
// Super Admin — User Management within Orgs
// ──────────────────────────────────────────────────────

export const addUserToOrg = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    clientId: z.string(),
    clerkUserId: z.string().min(1),
    role: z.enum(['ADMIN', 'CONTRIBUTOR', 'VIEWER']).default('VIEWER'),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()

    // Find or create AppUser by clerkUserId
    let appUser = await prisma.appUser.findUnique({
      where: { clerkUserId: data.clerkUserId },
    })
    if (!appUser) {
      appUser = await prisma.appUser.create({
        data: { clerkUserId: data.clerkUserId },
      })
    }

    return prisma.clientUser.create({
      data: {
        userId: appUser.id,
        clientId: data.clientId,
        role: data.role,
      },
    })
  })

export const removeUserFromOrg = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    clientId: z.string(),
    userId: z.string(),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.clientUser.delete({
      where: { userId_clientId: { userId: data.userId, clientId: data.clientId } },
    })
  })

export const updateUserOrgRole = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    clientId: z.string(),
    userId: z.string(),
    role: z.enum(['ADMIN', 'CONTRIBUTOR', 'VIEWER']),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.clientUser.update({
      where: { userId_clientId: { userId: data.userId, clientId: data.clientId } },
      data: { role: data.role },
    })
  })

// ──────────────────────────────────────────────────────
// Super Admin — User Management
// ──────────────────────────────────────────────────────

export const getAppUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const { page, limit } = data
    const [users, total] = await Promise.all([
      prisma.appUser.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { memberships: true } },
        },
      }),
      prisma.appUser.count(),
    ])
    return { users, total, page, limit }
  })

export const toggleSuperAdmin = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string(),
    isSuperAdmin: z.boolean(),
  }))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return prisma.appUser.update({
      where: { id: data.userId },
      data: { isSuperAdmin: data.isSuperAdmin },
    })
  })
