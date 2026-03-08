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
        members: true,
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
