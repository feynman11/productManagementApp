import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth, requireProductAuth } from '~/lib/auth.server'
import { canProductWrite, canProductAdmin, canProductContribute } from '~/lib/permissions'
import { createNotification } from '~/lib/notifications.server'

// ──────────────────────────────────────────────────────
// Ideas — Server Functions
// ──────────────────────────────────────────────────────

function calculateRiceScore(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null,
): number | null {
  if (
    reach == null ||
    impact == null ||
    confidence == null ||
    effort == null ||
    effort === 0
  )
    return null
  return (reach * impact * confidence) / effort
}

export const getIdeas = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      productId: z.string(),
      status: z
        .enum([
          'SUBMITTED',
          'UNDER_REVIEW',
          'CONVERTED',
          'IN_PROGRESS',
          'COMPLETED',
          'REJECTED',
          'DUPLICATE',
        ])
        .optional(),
      sortBy: z
        .enum(['riceScore', 'votes', 'createdAt'])
        .default('createdAt'),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    const orderBy =
      data.sortBy === 'riceScore'
        ? { riceScore: 'desc' as const }
        : data.sortBy === 'votes'
          ? { votes: 'desc' as const }
          : { createdAt: 'desc' as const }

    return prisma.idea.findMany({
      where: {
        productId: data.productId,
        clientId,
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        _count: { select: { comments: true } },
        tags: true,
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        convertedToItem: { select: { id: true, roadmap: { select: { productId: true } } } },
      },
      orderBy,
    })
  })

export const getIdea = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ ideaId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const idea = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        tags: true,
        convertedToItem: { select: { id: true, roadmap: { select: { productId: true } } } },
      },
    })
    if (!idea) throw new Error('Idea not found')
    return idea
  })

// VIEWER+ can create ideas
export const createIdea = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      tags: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, userId, effectiveProductRole } = await requireProductAuth({ productId: data.productId })
    if (!canProductContribute(effectiveProductRole)) throw new Error('Insufficient permissions')

    return prisma.idea.create({
      data: {
        title: data.title,
        description: data.description,
        productId: data.productId,
        clientId,
        authorId: userId,
        ...(data.tags && data.tags.length > 0
          ? {
              tags: {
                connectOrCreate: data.tags.map((tagName) => ({
                  where: { name: tagName },
                  create: { name: tagName },
                })),
              },
            }
          : {}),
      },
      include: { tags: true },
    })
  })

// MEMBER+ can edit ideas (title, description, RICE scoring)
export const updateIdea = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).optional(),
      riceReach: z.number().int().min(0).optional(),
      riceImpact: z.number().int().min(0).optional(),
      riceConfidence: z.number().min(0).max(1).optional(),
      riceEffort: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    const { ideaId, ...updateData } = data

    // Verify idea belongs to client and get productId
    const existing = await prisma.idea.findFirst({
      where: { id: ideaId, clientId },
    })
    if (!existing) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: existing.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    // Merge existing RICE fields with incoming updates to calculate score
    const reach = updateData.riceReach ?? existing.riceReach
    const impact = updateData.riceImpact ?? existing.riceImpact
    const confidence = updateData.riceConfidence ?? existing.riceConfidence
    const effort = updateData.riceEffort ?? existing.riceEffort
    const riceScore = calculateRiceScore(reach, impact, confidence, effort)

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        ...updateData,
        riceScore,
      },
      include: { tags: true },
    })
  })

// OWNER only can change idea status
export const updateIdeaStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      status: z.enum([
        'SUBMITTED',
        'UNDER_REVIEW',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'DUPLICATE',
      ]),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, userId } = await requireClientAuth()

    const existing = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
    })
    if (!existing) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: existing.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Product owner permission required')

    const updated = await prisma.idea.update({
      where: { id: data.ideaId },
      data: { status: data.status },
    })

    // Notify idea author about status change
    if (existing.authorId !== userId) {
      createNotification({
        type: 'IDEA_STATUS_CHANGED',
        title: 'Idea status updated',
        message: `"${existing.title}" status changed to ${data.status.replace(/_/g, ' ').toLowerCase()}`,
        recipientId: existing.authorId,
        clientId,
        ideaId: data.ideaId,
      }).catch(() => {})
    }

    return updated
  })

// VIEWER+ can vote on ideas
export const voteIdea = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ ideaId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId, userId } = await requireClientAuth()

    const existing = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
    })
    if (!existing) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: existing.productId })
    if (!canProductContribute(effectiveProductRole)) throw new Error('Insufficient permissions')

    const updated = await prisma.idea.update({
      where: { id: data.ideaId },
      data: { votes: { increment: 1 } },
    })

    // Notify idea author about the vote (don't notify self)
    if (existing.authorId !== userId) {
      createNotification({
        type: 'IDEA_VOTED',
        title: 'Your idea received a vote',
        message: `Someone voted for "${existing.title}"`,
        recipientId: existing.authorId,
        clientId,
        ideaId: data.ideaId,
      }).catch(() => {}) // fire-and-forget
    }

    return updated
  })

// VIEWER+ can comment on ideas
export const addIdeaComment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, userId } = await requireClientAuth()

    // Verify idea belongs to client
    const idea = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
    })
    if (!idea) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: idea.productId })
    if (!canProductContribute(effectiveProductRole)) throw new Error('Insufficient permissions')

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        ideaId: data.ideaId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    // Notify idea author about the comment (don't notify self)
    if (idea.authorId !== userId) {
      createNotification({
        type: 'IDEA_COMMENTED',
        title: 'New comment on your idea',
        message: `Someone commented on "${idea.title}"`,
        recipientId: idea.authorId,
        clientId,
        ideaId: data.ideaId,
      }).catch(() => {})
    }

    return comment
  })

// OWNER only can convert ideas to features
export const convertToFeature = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      ideaId: z.string(),
      featureName: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Verify idea belongs to client
    const idea = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
    })
    if (!idea) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: idea.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Product owner permission required')

    if (idea.status === 'CONVERTED')
      throw new Error('Idea has already been converted to a feature')

    // Pick the first roadmap for the idea's product
    const roadmap = await prisma.roadmap.findFirst({
      where: { productId: idea.productId, clientId },
      orderBy: { createdAt: 'asc' },
    })
    if (!roadmap) throw new Error('No roadmap found for this product')

    const featureTitle = data.featureName?.trim() || idea.title

    // Create feature from idea and link them bidirectionally
    const roadmapItem = await prisma.roadmapItem.create({
      data: {
        title: featureTitle,
        description: idea.description,
        roadmapId: roadmap.id,
        status: 'BACKLOG',
      },
    })

    await prisma.idea.update({
      where: { id: data.ideaId },
      data: {
        status: 'CONVERTED',
        convertedToItemId: roadmapItem.id,
      },
    })

    return roadmapItem
  })
