import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'
import { canWrite, canAdmin } from '~/lib/permissions'

// ──────────────────────────────────────────────────────
// Roadmap — Server Functions
// ──────────────────────────────────────────────────────

// Get all features for a product (across its roadmap)
export const getProductFeatures = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      select: { id: true },
    })
    if (!product) throw new Error('Product not found')

    return prisma.roadmapItem.findMany({
      where: { roadmap: { productId: data.productId, clientId } },
      include: { release: { select: { id: true, name: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
  })

// Get all releases for a product (across its roadmap)
export const getProductReleases = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      select: { id: true },
    })
    if (!product) throw new Error('Product not found')

    return prisma.release.findMany({
      where: { roadmap: { productId: data.productId, clientId } },
      include: {
        items: {
          select: { id: true, title: true, status: true, priority: true },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

// Get or auto-create the single roadmap for a product
export const getOrCreateProductRoadmap = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      select: { id: true, name: true },
    })
    if (!product) throw new Error('Product not found')

    // Find existing roadmap or create a default one
    let roadmap = await prisma.roadmap.findFirst({
      where: { productId: data.productId, clientId },
      include: {
        items: {
          include: { release: true },
          orderBy: [{ startDate: 'asc' }, { priority: 'desc' }],
        },
        releases: {
          include: { _count: { select: { items: true } } },
          orderBy: { targetDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!roadmap) {
      const created = await prisma.roadmap.create({
        data: {
          name: `${product.name} Roadmap`,
          productId: data.productId,
          clientId,
        },
      })
      // Return with same shape as the findFirst include
      return { ...created, items: [], releases: [] } as NonNullable<typeof roadmap>
    }

    return roadmap
  })

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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

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

// Convenience: add a feature to a product's single roadmap (auto-creates if needed)
export const addFeatureToProduct = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      priority: z.number().int().default(0),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
      select: { id: true, name: true },
    })
    if (!product) throw new Error('Product not found')

    // Get or create the single roadmap for this product
    let roadmap = await prisma.roadmap.findFirst({
      where: { productId: data.productId, clientId },
      orderBy: { createdAt: 'asc' },
    })
    if (!roadmap) {
      roadmap = await prisma.roadmap.create({
        data: {
          name: `${product.name} Roadmap`,
          productId: data.productId,
          clientId,
        },
      })
    }

    return prisma.roadmapItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        roadmapId: roadmap.id,
      },
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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

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

      // Validate feature dates fall within release target date
      if (release.targetDate && data.endDate) {
        if (new Date(data.endDate) > new Date(release.targetDate)) {
          throw new Error('Feature end date must be on or before the release target date')
        }
      }
      if (release.targetDate && data.startDate) {
        if (new Date(data.startDate) > new Date(release.targetDate)) {
          throw new Error('Feature start date must be on or before the release target date')
        }
      }
    }

    // Features assigned to a release must be PLANNED (not BACKLOG)
    // and must have dates within the release date range
    if (data.releaseId) {
      if (!data.startDate || !data.endDate) {
        throw new Error('Start date and end date are required for features assigned to a release')
      }
    }

    return prisma.roadmapItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.releaseId ? 'PLANNED' : 'BACKLOG',
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
      status: z.enum(['BACKLOG', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      releaseId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

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

    // Resolve effective values after update
    const effectiveStatus = updateData.status ?? item.status
    const effectiveReleaseId = updateData.releaseId !== undefined ? updateData.releaseId : item.releaseId
    const effectiveStartDate = updateData.startDate ?? item.startDate
    const effectiveEndDate = updateData.endDate ?? item.endDate

    // Only PLANNED features with dates inside the release range are allowed
    if (effectiveStatus !== 'BACKLOG') {
      if (!effectiveReleaseId) {
        throw new Error('A release is required for non-Backlog features')
      }
      if (!effectiveStartDate || !effectiveEndDate) {
        throw new Error('Start date and end date are required for non-Backlog features')
      }

      // Validate feature dates fall within release target date
      const release = await prisma.release.findFirst({
        where: { id: effectiveReleaseId, roadmapId: item.roadmap.id },
      })
      if (release?.targetDate) {
        if (new Date(effectiveEndDate) > new Date(release.targetDate)) {
          throw new Error('Feature end date must be on or before the release target date')
        }
        if (new Date(effectiveStartDate) > new Date(release.targetDate)) {
          throw new Error('Feature start date must be on or before the release target date')
        }
      }
    }

    // If moving to BACKLOG, clear release and dates
    if (effectiveStatus === 'BACKLOG' && item.status !== 'BACKLOG') {
      updateData.releaseId = null as any
      updateData.startDate = null as any
      updateData.endDate = null as any
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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

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

    // Non-BACKLOG statuses require a release and dates within release range
    if (data.status !== 'BACKLOG') {
      const effectiveReleaseId = data.releaseId !== undefined ? data.releaseId : item.releaseId
      if (!effectiveReleaseId) {
        throw new Error('A release is required to move a feature out of Backlog')
      }
      if (!item.startDate || !item.endDate) {
        throw new Error('Start date and end date are required to move a feature out of Backlog')
      }

      // Validate feature dates fall within release target date
      const release = await prisma.release.findFirst({
        where: { id: effectiveReleaseId, roadmapId: item.roadmap.id },
      })
      if (release?.targetDate) {
        if (new Date(item.endDate) > new Date(release.targetDate)) {
          throw new Error('Feature end date must be on or before the release target date')
        }
        if (new Date(item.startDate) > new Date(release.targetDate)) {
          throw new Error('Feature start date must be on or before the release target date')
        }
      }
    }

    // If moving to BACKLOG, clear release and dates
    const clearFields = data.status === 'BACKLOG' && item.status !== 'BACKLOG'
      ? { releaseId: null, startDate: null, endDate: null }
      : {}

    return prisma.roadmapItem.update({
      where: { id: data.itemId },
      data: {
        status: data.status,
        ...(data.releaseId !== undefined
          ? { releaseId: data.releaseId }
          : {}),
        ...clearFields,
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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canAdmin(role, isDemo))
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
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canAdmin(role, isDemo))
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
