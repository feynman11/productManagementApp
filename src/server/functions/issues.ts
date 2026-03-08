import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'
import { canWrite, canAdmin } from '~/lib/permissions'
import { createNotification } from '~/lib/notifications.server'

// ──────────────────────────────────────────────────────
// Issues — Server Functions
// ──────────────────────────────────────────────────────

export const getIssues = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      productId: z.string(),
      status: z
        .enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX'])
        .optional(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    return prisma.issue.findMany({
      where: {
        productId: data.productId,
        clientId,
        ...(data.status ? { status: data.status } : {}),
        ...(data.severity ? { severity: data.severity } : {}),
      },
      include: {
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

export const getIssue = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ issueId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()
    const issue = await prisma.issue.findFirst({
      where: { id: data.issueId, clientId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!issue) throw new Error('Issue not found')
    return issue
  })

export const createIssue = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      severity: z
        .enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
        .default('MEDIUM'),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo, userId } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    return prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        productId: data.productId,
        clientId,
        reporterId: userId,
      },
    })
  })

export const updateIssue = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      issueId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).optional(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
      status: z
        .enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX'])
        .optional(),
      customersAffected: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    const { issueId, ...updateData } = data

    // Verify issue belongs to client
    const existing = await prisma.issue.findFirst({
      where: { id: issueId, clientId },
    })
    if (!existing) throw new Error('Issue not found')

    return prisma.issue.update({
      where: { id: issueId },
      data: updateData,
    })
  })

export const assignIssue = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      issueId: z.string(),
      assigneeId: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo, userId } = await requireClientAuth()
    if (!canAdmin(role, isDemo))
      throw new Error('Admin permission required')

    // Verify issue belongs to client
    const existing = await prisma.issue.findFirst({
      where: { id: data.issueId, clientId },
    })
    if (!existing) throw new Error('Issue not found')

    const updated = await prisma.issue.update({
      where: { id: data.issueId },
      data: { assigneeId: data.assigneeId },
    })

    // Notify the new assignee
    if (data.assigneeId && data.assigneeId !== userId) {
      createNotification({
        type: 'ISSUE_ASSIGNED',
        title: 'Issue assigned to you',
        message: `You were assigned to "${existing.title}"`,
        recipientId: data.assigneeId,
        clientId,
        issueId: data.issueId,
      }).catch(() => {})
    }

    return updated
  })

export const addIssueComment = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      issueId: z.string(),
      content: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId, role, isDemo, userId } = await requireClientAuth()
    if (!canWrite(role, isDemo)) throw new Error('Insufficient permissions')

    // Verify issue belongs to client
    const issue = await prisma.issue.findFirst({
      where: { id: data.issueId, clientId },
    })
    if (!issue) throw new Error('Issue not found')

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        issueId: data.issueId,
      },
    })

    // Notify reporter and assignee about the comment (don't notify self)
    const recipients = new Set<string>()
    if (issue.reporterId !== userId) recipients.add(issue.reporterId)
    if (issue.assigneeId && issue.assigneeId !== userId) recipients.add(issue.assigneeId)

    for (const recipientId of recipients) {
      createNotification({
        type: 'ISSUE_COMMENTED',
        title: 'New comment on issue',
        message: `Someone commented on "${issue.title}"`,
        recipientId,
        clientId,
        issueId: data.issueId,
      }).catch(() => {})
    }

    return comment
  })
