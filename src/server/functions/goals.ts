import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireProductAuth } from '~/lib/auth.server'
import { canProductAdmin } from '~/lib/permissions'

// ──────────────────────────────────────────────────────
// Goals — Server Functions
// ──────────────────────────────────────────────────────

export const getProductGoals = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireProductAuth({ productId: data.productId })
    return prisma.goal.findMany({
      where: { productId: data.productId, product: { clientId } },
      orderBy: { createdAt: 'desc' },
    })
  })

export const createGoal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      targetValue: z.number().optional(),
      currentValue: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { effectiveProductRole } = await requireProductAuth({ productId: data.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Only product owners and super admins can manage goals')
    return prisma.goal.create({ data })
  })

export const updateGoal = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      goalId: z.string(),
      productId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      targetValue: z.number().nullable().optional(),
      currentValue: z.number().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId } = await requireProductAuth({ productId: data.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Only product owners and super admins can manage goals')

    // Verify goal belongs to this product
    const goal = await prisma.goal.findFirst({
      where: { id: data.goalId, productId: data.productId, product: { clientId } },
    })
    if (!goal) throw new Error('Goal not found')

    const { goalId, productId, ...updateData } = data
    return prisma.goal.update({ where: { id: goalId }, data: updateData })
  })

export const deleteGoal = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ goalId: z.string(), productId: z.string() }))
  .handler(async ({ data }) => {
    const { effectiveProductRole, clientId } = await requireProductAuth({ productId: data.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Only product owners and super admins can manage goals')

    const goal = await prisma.goal.findFirst({
      where: { id: data.goalId, productId: data.productId, product: { clientId } },
    })
    if (!goal) throw new Error('Goal not found')

    return prisma.goal.delete({ where: { id: data.goalId } })
  })
