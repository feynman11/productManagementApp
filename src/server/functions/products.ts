import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'
import { canWrite, canAdmin } from '~/lib/permissions'

// ──────────────────────────────────────────────────────
// Products — Server Functions
// ──────────────────────────────────────────────────────

export const getProducts = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { clientId } = await requireClientAuth()
    const products = await prisma.product.findMany({
      where: { clientId },
      include: {
        _count: { select: { ideas: true, issues: true } },
        roadmaps: {
          select: {
            _count: {
              select: { items: true },
            },
            items: {
              where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    return products.map(({ roadmaps, ...product }) => ({
      ...product,
      activeFeatureCount: roadmaps.reduce((sum, r) => sum + r.items.length, 0),
    }))
  })

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      include: {
        _count: {
          select: { ideas: true, issues: true, members: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        goals: true,
        roadmaps: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            items: {
              where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
              select: { id: true },
            },
            releases: {
              include: {
                _count: { select: { items: true } },
              },
              orderBy: { targetDate: 'asc' },
            },
          },
        },
      },
    })
    if (!product) throw new Error('Product not found')

    // Flatten releases from the single roadmap
    const releases = product.roadmaps[0]?.releases ?? []
    const activeFeatureCount = product.roadmaps.reduce((sum, r) => sum + r.items.length, 0)
    const { roadmaps, ...rest } = product
    return { ...rest, releases, activeFeatureCount }
  })

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      vision: z.string().optional(),
      strategy: z.string().optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .default('#3B82F6'),
      icon: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')
    return prisma.product.create({
      data: { ...data, clientId },
    })
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      vision: z.string().optional(),
      strategy: z.string().optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      icon: z.string().optional(),
      status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')
    const { productId, ...updateData } = data
    const existing = await prisma.product.findFirst({
      where: { id: productId, clientId },
    })
    if (!existing) throw new Error('Product not found')
    return prisma.product.update({
      where: { id: productId },
      data: updateData,
    })
  })

export const archiveProduct = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canAdmin(role, isDemo))
      throw new Error('Admin permission required')
    const existing = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!existing) throw new Error('Product not found')
    return prisma.product.update({
      where: { id: data.productId },
      data: { status: 'ARCHIVED' },
    })
  })

// ──────────────────────────────────────────────────────
// Product Members — Server Functions
// ──────────────────────────────────────────────────────

export const searchOrgUsersNotInProduct = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      productId: z.string(),
      query: z.string().default(''),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    // Get users already in the product
    const existingUserIds = (
      await prisma.productMember.findMany({
        where: { productId: data.productId, clientId },
        select: { userId: true },
      })
    ).map((pm) => pm.userId)

    // Search org members not already in the product
    return prisma.appUser.findMany({
      where: {
        memberships: { some: { clientId } },
        id: { notIn: existingUserIds.length > 0 ? existingUserIds : undefined },
        ...(data.query
          ? {
              OR: [
                { name: { contains: data.query, mode: 'insensitive' } },
                { email: { contains: data.query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 20,
      orderBy: { name: 'asc' },
    })
  })

export const addProductMember = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      userId: z.string().min(1),
      role: z.enum(['LEAD', 'MEMBER']).default('MEMBER'),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    // Verify product belongs to this org
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    // Verify user is a member of this org
    const orgMember = await prisma.clientUser.findUnique({
      where: { userId_clientId: { userId: data.userId, clientId } },
    })
    if (!orgMember) throw new Error('User is not a member of this organization')

    return prisma.productMember.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        role: data.role,
        clientId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })
  })

export const removeProductMember = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      userId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    const member = await prisma.productMember.findFirst({
      where: { productId: data.productId, userId: data.userId, clientId },
    })
    if (!member) throw new Error('Member not found')

    return prisma.productMember.delete({ where: { id: member.id } })
  })

export const updateProductMemberRole = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      userId: z.string(),
      role: z.enum(['LEAD', 'MEMBER']),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    const member = await prisma.productMember.findFirst({
      where: { productId: data.productId, userId: data.userId, clientId },
    })
    if (!member) throw new Error('Member not found')

    return prisma.productMember.update({
      where: { id: member.id },
      data: { role: data.role },
    })
  })

export const getProductDashboard = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { clientId } = await requireClientAuth()
    const products = await prisma.product.findMany({
      where: { clientId, status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            ideas: true,
            roadmaps: true,
            issues: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return products
  })
