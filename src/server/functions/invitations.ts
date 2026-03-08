import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { clerkClient } from '@clerk/tanstack-react-start/server'
import { prisma } from '~/lib/prisma'
import { requireOrgAdmin, requireClientAuth } from '~/lib/auth.server'

const productAssignmentSchema = z.object({
  productId: z.string(),
  role: z.enum(['OWNER', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

// ──────────────────────────────────────────────────────
// Invite a user to an org (with optional product assignments)
// ──────────────────────────────────────────────────────

export const inviteUserToOrg = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      emailAddress: z.string().email(),
      role: z.enum(['ADMIN', 'CONTRIBUTOR', 'VIEWER']).default('VIEWER'),
      products: z.array(productAssignmentSchema).default([]),
    }),
  )
  .handler(async ({ data }) => {
    await requireOrgAdmin(data.clientId)

    // Verify org exists and is active, not demo
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true, status: true, isDemo: true },
    })
    if (!client || client.status !== 'ACTIVE') throw new Error('Organization not found')
    if (client.isDemo) throw new Error('Cannot invite users to demo organization')

    // Validate that all referenced products belong to this org
    if (data.products.length > 0) {
      const productIds = data.products.map((p) => p.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, clientId: data.clientId },
        select: { id: true },
      })
      if (products.length !== productIds.length) {
        throw new Error('One or more products not found in this organization')
      }
    }

    // Check if user already exists in the app
    const existingAppUser = await prisma.appUser.findFirst({
      where: { email: { equals: data.emailAddress, mode: 'insensitive' } },
    })

    if (existingAppUser) {
      // Check if already a member
      const existingMembership = await prisma.clientUser.findUnique({
        where: { userId_clientId: { userId: existingAppUser.id, clientId: data.clientId } },
      })
      if (existingMembership) {
        throw new Error('User is already a member of this organization')
      }

      // User exists but isn't a member — add them directly
      await prisma.clientUser.create({
        data: {
          userId: existingAppUser.id,
          clientId: data.clientId,
          role: data.role,
        },
      })

      // Add to products
      for (const pa of data.products) {
        const exists = await prisma.productMember.findUnique({
          where: { productId_userId: { productId: pa.productId, userId: existingAppUser.id } },
        })
        if (!exists) {
          await prisma.productMember.create({
            data: {
              productId: pa.productId,
              userId: existingAppUser.id,
              clientId: data.clientId,
              role: pa.role,
            },
          })
        }
      }

      return { type: 'added' as const, email: data.emailAddress }
    }

    // New user — send Clerk invitation with org metadata
    const clerk = clerkClient()

    const invitationEntry = {
      clientId: data.clientId,
      role: data.role,
      invitedAt: new Date().toISOString(),
      products: data.products.length > 0 ? data.products : undefined,
    }

    // Check for existing pending invitation for this email
    const existingInvitations = await clerk.invitations.getInvitationList({
      status: 'pending',
    })
    const existingInvite = existingInvitations.data.find(
      (inv) => inv.emailAddress.toLowerCase() === data.emailAddress.toLowerCase(),
    )

    if (existingInvite) {
      // Check if already invited to this org
      const pendingMeta = (existingInvite.publicMetadata as Record<string, unknown>) ?? {}
      const pendingInvitations = (pendingMeta.pendingInvitations ?? []) as Array<{ clientId: string }>
      if (pendingInvitations.some((p) => p.clientId === data.clientId)) {
        throw new Error('User already has a pending invitation to this organization')
      }

      // Revoke old invitation and re-create with combined metadata
      await clerk.invitations.revokeInvitation(existingInvite.id)
      pendingInvitations.push(invitationEntry as unknown as { clientId: string })

      await clerk.invitations.createInvitation({
        emailAddress: data.emailAddress,
        publicMetadata: { ...pendingMeta, pendingInvitations },
        notify: true,
      })
    } else {
      await clerk.invitations.createInvitation({
        emailAddress: data.emailAddress,
        publicMetadata: {
          pendingInvitations: [invitationEntry],
        },
        notify: true,
      })
    }

    return { type: 'invited' as const, email: data.emailAddress }
  })

// ──────────────────────────────────────────────────────
// Get org products with actions (for the invite picker)
// ──────────────────────────────────────────────────────

export const getOrgProductsForInvite = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireOrgAdmin(data.clientId)

    const products = await prisma.product.findMany({
      where: { clientId: data.clientId },
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: { name: 'asc' },
    })

    return products
  })

// ──────────────────────────────────────────────────────
// List pending invitations for an org
// ──────────────────────────────────────────────────────

export const getPendingInvitations = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireOrgAdmin(data.clientId)

    const clerk = clerkClient()
    const invitations = await clerk.invitations.getInvitationList({
      status: 'pending',
    })

    // Filter to invitations that include this org
    return invitations.data
      .filter((inv) => {
        const meta = (inv.publicMetadata as Record<string, unknown>) ?? {}
        const pending = (meta.pendingInvitations ?? []) as Array<{ clientId: string }>
        return pending.some((p) => p.clientId === data.clientId)
      })
      .map((inv) => {
        const meta = (inv.publicMetadata as Record<string, unknown>) ?? {}
        const pending = (meta.pendingInvitations ?? []) as Array<{
          clientId: string
          role: string
          invitedAt: string
          products?: Array<{ productId: string; role: string }>
        }>
        const orgEntry = pending.find((p) => p.clientId === data.clientId)!
        return {
          id: inv.id,
          emailAddress: inv.emailAddress,
          role: orgEntry.role,
          invitedAt: orgEntry.invitedAt,
          createdAt: inv.createdAt,
          products: orgEntry.products ?? [],
        }
      })
  })

// ──────────────────────────────────────────────────────
// Revoke a pending invitation
// ──────────────────────────────────────────────────────

export const revokeInvitation = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ invitationId: z.string(), clientId: z.string() }))
  .handler(async ({ data }) => {
    await requireOrgAdmin(data.clientId)

    const clerk = clerkClient()
    await clerk.invitations.revokeInvitation(data.invitationId)

    return { success: true }
  })

// ──────────────────────────────────────────────────────
// Get org members (accessible to all org members)
// ──────────────────────────────────────────────────────

export const getOrgMembers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth({ slug: data.slug })

    const members = await prisma.clientUser.findMany({
      where: { clientId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, isSuperAdmin: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      isSuperAdmin: m.user.isSuperAdmin,
      joinedAt: m.createdAt,
    }))
  })

// ──────────────────────────────────────────────────────
// Update an org member's role (org admin or super admin)
// ──────────────────────────────────────────────────────

export const updateOrgMemberRole = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      userId: z.string(),
      role: z.enum(['ADMIN', 'CONTRIBUTOR', 'VIEWER']),
    }),
  )
  .handler(async ({ data }) => {
    const adminUser = await requireOrgAdmin(data.clientId)

    // Prevent demoting yourself if you're the last admin
    if (data.userId === adminUser.id && data.role !== 'ADMIN') {
      const adminCount = await prisma.clientUser.count({
        where: { clientId: data.clientId, role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        throw new Error('Cannot change role: you are the only admin')
      }
    }

    return prisma.clientUser.update({
      where: { userId_clientId: { userId: data.userId, clientId: data.clientId } },
      data: { role: data.role },
    })
  })

// ──────────────────────────────────────────────────────
// Remove an org member (org admin or super admin)
// ──────────────────────────────────────────────────────

export const removeOrgMember = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clientId: z.string(), userId: z.string() }))
  .handler(async ({ data }) => {
    const adminUser = await requireOrgAdmin(data.clientId)

    // Prevent removing yourself if you're the last admin
    if (data.userId === adminUser.id) {
      const adminCount = await prisma.clientUser.count({
        where: { clientId: data.clientId, role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        throw new Error('Cannot remove yourself: you are the only admin')
      }
    }

    return prisma.clientUser.delete({
      where: { userId_clientId: { userId: data.userId, clientId: data.clientId } },
    })
  })
