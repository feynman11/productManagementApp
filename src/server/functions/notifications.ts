import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth } from '~/lib/auth.server'

export const getNotifications = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      limit: z.number().int().positive().max(50).default(20),
      cursor: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { userId, clientId } = await requireClientAuth()

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId, clientId },
      orderBy: { createdAt: 'desc' },
      take: data.limit + 1,
      ...(data.cursor ? { cursor: { id: data.cursor }, skip: 1 } : {}),
    })

    const hasMore = notifications.length > data.limit
    if (hasMore) notifications.pop()

    return {
      notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : undefined,
    }
  })

export const getUnreadCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { userId, clientId } = await requireClientAuth()

    const count = await prisma.notification.count({
      where: { recipientId: userId, clientId, read: false },
    })

    return { count }
  })

export const markAsRead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ notificationId: z.string() }))
  .handler(async ({ data }) => {
    const { userId, clientId } = await requireClientAuth()

    const notification = await prisma.notification.findFirst({
      where: { id: data.notificationId, recipientId: userId, clientId },
    })
    if (!notification) throw new Error('Notification not found')

    return prisma.notification.update({
      where: { id: data.notificationId },
      data: { read: true },
    })
  })

export const markAllAsRead = createServerFn({ method: 'POST' })
  .handler(async () => {
    const { userId, clientId } = await requireClientAuth()

    await prisma.notification.updateMany({
      where: { recipientId: userId, clientId, read: false },
      data: { read: true },
    })

    return { success: true }
  })
