import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth, requireProductAuth } from '~/lib/auth.server'
import { canProductWrite } from '~/lib/permissions'

// ──────────────────────────────────────────────────────
// Action Items — Server Functions
// ──────────────────────────────────────────────────────

export const getProductActions = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireProductAuth({ productId: data.productId })
    return prisma.actionItem.findMany({
      where: { productId: data.productId, clientId },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { comments: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            content: true,
            author: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

export const getActionItem = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ actionItemId: z.string(), productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireProductAuth({ productId: data.productId })
    const item = await prisma.actionItem.findFirst({
      where: { id: data.actionItemId, productId: data.productId, clientId },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!item) throw new Error('Action item not found')
    return item
  })

export const createActionItem = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
      dueDate: z.string().optional(),
      assigneeId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId, userId } = await requireProductAuth({ productId: data.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    return prisma.actionItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        productId: data.productId,
        clientId,
        raisedById: userId,
        assigneeId: data.assigneeId,
      },
    })
  })

const STATUS_LABELS: Record<string, string> = { NEW: 'New', IN_PROGRESS: 'In Progress', DONE: 'Done' }
const PRIORITY_LABELS: Record<string, string> = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

export const updateActionItem = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      actionItemId: z.string(),
      productId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']).optional(),
      priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
      dueDate: z.string().nullable().optional(),
      assigneeId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId, userId } = await requireProductAuth({ productId: data.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    const item = await prisma.actionItem.findFirst({
      where: { id: data.actionItemId, productId: data.productId, clientId },
      include: { assignee: { select: { name: true } } },
    })
    if (!item) throw new Error('Action item not found')

    // Build auto-comment lines for tracked field changes
    const changes: string[] = []

    if (data.status !== undefined && data.status !== item.status) {
      changes.push(`Status changed from ${STATUS_LABELS[item.status]} to ${STATUS_LABELS[data.status]}`)
    }
    if (data.priority !== undefined && data.priority !== item.priority) {
      changes.push(`Priority changed from ${PRIORITY_LABELS[item.priority]} to ${PRIORITY_LABELS[data.priority]}`)
    }
    if (data.dueDate !== undefined) {
      const oldDate = item.dueDate ? item.dueDate.toISOString().split('T')[0] : null
      const newDate = data.dueDate || null
      if (oldDate !== newDate) {
        if (!newDate) {
          changes.push('Due date removed')
        } else if (!oldDate) {
          changes.push(`Due date set to ${new Date(newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
        } else {
          changes.push(`Due date changed to ${new Date(newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
        }
      }
    }
    if (data.assigneeId !== undefined) {
      const oldAssigneeId = item.assigneeId ?? null
      const newAssigneeId = data.assigneeId ?? null
      if (oldAssigneeId !== newAssigneeId) {
        if (!newAssigneeId) {
          changes.push('Assignee removed')
        } else {
          const newAssignee = await prisma.appUser.findUnique({
            where: { id: newAssigneeId },
            select: { name: true, email: true },
          })
          const assigneeName = newAssignee?.name || newAssignee?.email || 'someone'
          changes.push(`Assigned to ${assigneeName}`)
        }
      }
    }

    const { actionItemId, productId, ...updateData } = data

    // Use a transaction to update the item and create auto-comment atomically
    const [updated] = await prisma.$transaction([
      prisma.actionItem.update({
        where: { id: actionItemId },
        data: {
          ...updateData,
          dueDate: updateData.dueDate === null ? null : updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        },
      }),
      ...(changes.length > 0
        ? [
            prisma.comment.create({
              data: {
                content: changes.join('\n'),
                authorId: userId,
                actionItemId,
              },
            }),
          ]
        : []),
    ])

    return updated
  })

export const addActionComment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      actionItemId: z.string(),
      productId: z.string(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId, userId } = await requireProductAuth({ productId: data.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    // Verify action item exists
    const item = await prisma.actionItem.findFirst({
      where: { id: data.actionItemId, productId: data.productId, clientId },
    })
    if (!item) throw new Error('Action item not found')

    return prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        actionItemId: data.actionItemId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })
  })

export const deleteActionItem = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ actionItemId: z.string(), productId: z.string() }))
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId } = await requireProductAuth({ productId: data.productId })
    if (!canProductWrite(effectiveProductRole)) throw new Error('Insufficient permissions')

    const item = await prisma.actionItem.findFirst({
      where: { id: data.actionItemId, productId: data.productId, clientId },
    })
    if (!item) throw new Error('Action item not found')

    return prisma.actionItem.delete({ where: { id: data.actionItemId } })
  })

/** Get action items assigned to current user across all products in the org */
export const getMyActionItems = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { clientId, userId } = await requireClientAuth()
    return prisma.actionItem.findMany({
      where: {
        clientId,
        assigneeId: userId,
        status: { not: 'DONE' },
      },
      include: {
        product: { select: { id: true, name: true, color: true, icon: true } },
        raisedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
    })
  },
)

/** Get product members for assignee dropdown */
export const getProductMembers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireProductAuth({ productId: data.productId })
    return prisma.productMember.findMany({
      where: { productId: data.productId, clientId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { user: { name: 'asc' } },
    })
  })
