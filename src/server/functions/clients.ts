import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'

// TODO: Add requireSuperAdmin() guard when super admin auth is implemented

export const getClients = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }))
  .handler(async ({ data }) => {
    const { page, limit } = data
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count(),
    ])
    return { clients, total, page, limit }
  })

export const getClient = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      include: { clientUsers: true },
    })
    if (!client) throw new Error('Client not found')
    return client
  })

export const createClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  }))
  .handler(async ({ data }) => {
    return prisma.client.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: 'PENDING_SETUP',
      },
    })
  })

export const updateClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    clientId: z.string(),
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  }))
  .handler(async ({ data }) => {
    const { clientId, ...updateData } = data
    return prisma.client.update({
      where: { id: clientId },
      data: updateData,
    })
  })

export const suspendClient = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    return prisma.client.update({
      where: { id: data.clientId },
      data: { status: 'SUSPENDED' },
    })
  })
