import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth, requireProductAuth } from '~/lib/auth.server'
import { canProductWrite, canProductAdmin } from '~/lib/permissions'
import { createNotification } from '~/lib/notifications.server'

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

// MEMBER+ can add features
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
    const { clientId, effectiveProductRole } = await requireProductAuth({ productId: data.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

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

// Helper to resolve productId from a roadmapId
async function getProductIdFromRoadmap(roadmapId: string, clientId: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, clientId },
    select: { productId: true },
  })
  if (!roadmap) throw new Error('Roadmap not found')
  return roadmap.productId
}

// Helper to resolve productId from a roadmapItem
async function getProductIdFromItem(itemId: string, clientId: string) {
  const item = await prisma.roadmapItem.findFirst({
    where: { id: itemId },
    include: { roadmap: { select: { clientId: true, productId: true, id: true } } },
  })
  if (!item || item.roadmap.clientId !== clientId) throw new Error('Roadmap item not found')
  return { productId: item.roadmap.productId, item, roadmapId: item.roadmap.id }
}

// MEMBER+ can create roadmap items
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
    const { clientId } = await requireClientAuth()
    const productId = await getProductIdFromRoadmap(data.roadmapId, clientId)
    const { effectiveProductRole } = await requireProductAuth({ productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

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

// MEMBER+ can update roadmap items
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
    const { clientId } = await requireClientAuth()
    const { productId, item, roadmapId } = await getProductIdFromItem(data.itemId, clientId)
    const { effectiveProductRole } = await requireProductAuth({ productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    const { itemId, ...updateData } = data

    // Verify release belongs to the same roadmap if specified
    if (updateData.releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: updateData.releaseId, roadmapId },
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
        where: { id: effectiveReleaseId, roadmapId },
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

// MEMBER+ can move roadmap items between statuses
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
    const { clientId } = await requireClientAuth()
    const { productId, item, roadmapId } = await getProductIdFromItem(data.itemId, clientId)
    const { effectiveProductRole } = await requireProductAuth({ productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    // Verify release belongs to the same roadmap if specified
    if (data.releaseId) {
      const release = await prisma.release.findFirst({
        where: { id: data.releaseId, roadmapId },
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
        where: { id: effectiveReleaseId, roadmapId },
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

// OWNER only can create releases
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
    const { clientId } = await requireClientAuth()
    const productId = await getProductIdFromRoadmap(data.roadmapId, clientId)
    const { effectiveProductRole } = await requireProductAuth({ productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Product owner permission required')

    return prisma.release.create({
      data: {
        name: data.name,
        description: data.description,
        targetDate: data.targetDate,
        roadmapId: data.roadmapId,
      },
    })
  })

// Get a single feature with source idea info and phased comments
export const getFeature = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ featureId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const item = await prisma.roadmapItem.findFirst({
      where: { id: data.featureId },
      include: {
        roadmap: { select: { clientId: true, productId: true, name: true } },
        release: { select: { id: true, name: true } },
        sourceIdea: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
            comments: {
              include: {
                author: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
            tags: true,
          },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!item || item.roadmap.clientId !== clientId)
      throw new Error('Feature not found')
    return item
  })

// MEMBER+ can comment on features
export const addFeatureComment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      featureId: z.string(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, userId } = await requireClientAuth()

    const item = await prisma.roadmapItem.findFirst({
      where: { id: data.featureId },
      include: {
        roadmap: { select: { clientId: true, productId: true } },
        sourceIdea: { select: { authorId: true, title: true } },
      },
    })
    if (!item || item.roadmap.clientId !== clientId)
      throw new Error('Feature not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: item.roadmap.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        roadmapItemId: data.featureId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    // Notify original idea author if this feature came from an idea
    if (item.sourceIdea && item.sourceIdea.authorId !== userId) {
      createNotification({
        type: 'IDEA_COMMENTED',
        title: 'New comment on feature from your idea',
        message: `Someone commented on the feature "${item.title}"`,
        recipientId: item.sourceIdea.authorId,
        clientId,
      }).catch(() => {})
    }

    return comment
  })
