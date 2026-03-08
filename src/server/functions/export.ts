import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(escapeCsvField).join(',')
}

export const exportProductsCsv = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { clientId } = await requireClientAuth()

    const products = await prisma.product.findMany({
      where: { clientId },
      include: {
        _count: { select: { ideas: true, issues: true, roadmaps: true, members: true } },
      },
      orderBy: { name: 'asc' },
    })

    const header = toCsvRow(['Name', 'Description', 'Status', 'Color', 'Ideas', 'Issues', 'Roadmaps', 'Members', 'Created'])
    const rows = products.map((p) =>
      toCsvRow([
        p.name,
        p.description,
        p.status,
        p.color,
        p._count.ideas,
        p._count.issues,
        p._count.roadmaps,
        p._count.members,
        p.createdAt.toISOString().split('T')[0],
      ]),
    )

    return { csv: [header, ...rows].join('\n'), filename: 'products.csv' }
  })

export const exportIdeasCsv = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    const ideas = await prisma.idea.findMany({
      where: { productId: data.productId, clientId },
      include: { tags: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      'Title', 'Description', 'Status', 'Author ID', 'Votes',
      'RICE Reach', 'RICE Impact', 'RICE Confidence', 'RICE Effort', 'RICE Score',
      'Tags', 'Created',
    ])
    const rows = ideas.map((idea) =>
      toCsvRow([
        idea.title,
        idea.description,
        idea.status,
        idea.authorId,
        idea.votes,
        idea.riceReach,
        idea.riceImpact,
        idea.riceConfidence,
        idea.riceEffort,
        idea.riceScore != null ? Math.round(idea.riceScore * 100) / 100 : null,
        idea.tags.map((t) => t.name).join('; '),
        idea.createdAt.toISOString().split('T')[0],
      ]),
    )

    const slug = product.name.toLowerCase().replace(/\s+/g, '-')
    return { csv: [header, ...rows].join('\n'), filename: `ideas-${slug}.csv` }
  })

export const exportIssuesCsv = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    const issues = await prisma.issue.findMany({
      where: { productId: data.productId, clientId },
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      'Title', 'Description', 'Severity', 'Status',
      'Reporter ID', 'Assignee ID', 'Customers Affected', 'Created',
    ])
    const rows = issues.map((issue) =>
      toCsvRow([
        issue.title,
        issue.description,
        issue.severity,
        issue.status,
        issue.reporterId,
        issue.assigneeId,
        issue.customersAffected,
        issue.createdAt.toISOString().split('T')[0],
      ]),
    )

    const slug = product.name.toLowerCase().replace(/\s+/g, '-')
    return { csv: [header, ...rows].join('\n'), filename: `issues-${slug}.csv` }
  })
