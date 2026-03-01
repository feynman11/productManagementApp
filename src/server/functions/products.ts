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
    return prisma.product.findMany({
      where: { clientId },
      include: {
        _count: { select: { ideas: true, roadmaps: true, issues: true } },
      },
      orderBy: { name: 'asc' },
    })
  })

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      include: {
        _count: {
          select: { ideas: true, roadmaps: true, issues: true, members: true },
        },
        members: true,
        goals: true,
      },
    })
    if (!product) throw new Error('Product not found')
    return product
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
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')
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
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')
    const { productId, ...updateData } = data
    // Verify product belongs to client
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
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canAdmin(clientUserRole))
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
