import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'
import { canWrite, canAdmin } from '~/lib/permissions'

// ──────────────────────────────────────────────────────
// Roadmap — Server Functions
// ──────────────────────────────────────────────────────

export const getRoadmaps = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    return prisma.roadmap.findMany({
      where: { productId: data.productId, clientId },
      include: {
        _count: { select: { items: true, releases: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

export const getRoadmap = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ roadmapId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: data.roadmapId, clientId },
      include: {
        items: {
          include: {
            release: true,
          },
          orderBy: { priority: 'desc' },
        },
        releases: {
          include: {
            _count: { select: { items: true } },
          },
          orderBy: { targetDate: 'asc' },
        },
      },
    })
    if (!roadmap) throw new Error('Roadmap not found')
    return roadmap
  })

export const createRoadmap = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      isPublic: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    return prisma.roadmap.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        productId: data.productId,
        clientId,
      },
    })
  })

export const updateRoadmap = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      roadmapId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')

    const { roadmapId, ...updateData } = data

    // Verify roadmap belongs to client
    const existing = await prisma.roadmap.findFirst({
      where: { id: roadmapId, clientId },
    })
    if (!existing) throw new Error('Roadmap not found')

    return prisma.roadmap.update({
      where: { id: roadmapId },
      data: updateData,
    })
  })

export const createRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      roadmapId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      priority: z.number().int().default(0),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      releaseId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')

    // Verify roadmap belongs to client
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: data.roadmapId, clientId },
    })
    if (!roadmap) throw new Error('Roadmap not found')

    // Verify release belongs to this roadmap if specified
    if (data.releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: data.releaseId, roadmapId: data.roadmapId },
      })
      if (!release) throw new Error('Release not found in this roadmap')
    }

    return prisma.roadmapItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        startDate: data.startDate,
        endDate: data.endDate,
        roadmapId: data.roadmapId,
        releaseId: data.releaseId,
      },
    })
  })

export const updateRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      itemId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      priority: z.number().int().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      releaseId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')

    const { itemId, ...updateData } = data

    // Verify item belongs to client via roadmap
    const item = await prisma.roadmapItem.findFirst({
      where: { id: itemId },
      include: { roadmap: { select: { clientId: true, id: true } } },
    })
    if (!item || item.roadmap.clientId !== clientId)
      throw new Error('Roadmap item not found')

    // Verify release belongs to the same roadmap if specified
    if (updateData.releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: updateData.releaseId, roadmapId: item.roadmap.id },
      })
      if (!release) throw new Error('Release not found in this roadmap')
    }

    return prisma.roadmapItem.update({
      where: { id: itemId },
      data: updateData,
    })
  })

export const moveRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      itemId: z.string(),
      status: z.enum([
        'BACKLOG',
        'PLANNED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ]),
      releaseId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canWrite(clientUserRole)) throw new Error('Insufficient permissions')

    // Verify item belongs to client via roadmap
    const item = await prisma.roadmapItem.findFirst({
      where: { id: data.itemId },
      include: { roadmap: { select: { clientId: true, id: true } } },
    })
    if (!item || item.roadmap.clientId !== clientId)
      throw new Error('Roadmap item not found')

    // Verify release belongs to the same roadmap if specified
    if (data.releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: data.releaseId, roadmapId: item.roadmap.id },
      })
      if (!release) throw new Error('Release not found in this roadmap')
    }

    return prisma.roadmapItem.update({
      where: { id: data.itemId },
      data: {
        status: data.status,
        ...(data.releaseId !== undefined
          ? { releaseId: data.releaseId }
          : {}),
      },
    })
  })

export const createRelease = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      roadmapId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      targetDate: z.coerce.date().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canAdmin(clientUserRole))
      throw new Error('Admin permission required')

    // Verify roadmap belongs to client
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: data.roadmapId, clientId },
    })
    if (!roadmap) throw new Error('Roadmap not found')

    return prisma.release.create({
      data: {
        name: data.name,
        description: data.description,
        targetDate: data.targetDate,
        roadmapId: data.roadmapId,
      },
    })
  })

export const updateRelease = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      releaseId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      targetDate: z.coerce.date().optional(),
      status: z
        .enum(['PLANNED', 'IN_PROGRESS', 'RELEASED', 'CANCELLED'])
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, clientUserRole } = await requireClientAuth()
    if (!canAdmin(clientUserRole))
      throw new Error('Admin permission required')

    const { releaseId, ...updateData } = data

    // Verify release belongs to client via roadmap
    const release = await prisma.release.findFirst({
      where: { id: releaseId },
      include: { roadmap: { select: { clientId: true } } },
    })
    if (!release || release.roadmap.clientId !== clientId)
      throw new Error('Release not found')

    return prisma.release.update({
      where: { id: releaseId },
      data: updateData,
    })
  })
