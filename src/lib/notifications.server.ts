import { prisma } from './prisma'
import type { NotificationType } from '../generated/prisma/client/client'

interface CreateNotificationInput {
  type: NotificationType
  title: string
  message: string
  recipientId: string
  clientId: string
  ideaId?: string
  issueId?: string
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      recipientId: input.recipientId,
      clientId: input.clientId,
      ideaId: input.ideaId,
      issueId: input.issueId,
    },
  })
}

export async function notifyMany(
  inputs: CreateNotificationInput[],
) {
  if (inputs.length === 0) return
  return prisma.notification.createMany({
    data: inputs.map((input) => ({
      type: input.type,
      title: input.title,
      message: input.message,
      recipientId: input.recipientId,
      clientId: input.clientId,
      ideaId: input.ideaId,
      issueId: input.issueId,
    })),
  })
}
