import { Webhook } from 'svix'
import { prisma } from '~/lib/prisma'

// Webhook event types from Clerk
interface ClerkWebhookEvent {
  type: string
  data: Record<string, any>
}

/**
 * Verify and process a Clerk webhook event.
 * Called from the API route at /api/webhooks/clerk.
 */
export async function processClerkWebhook(request: Request): Promise<{ success: boolean }> {
  const payload = await request.text()
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing svix headers')
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    throw new Error('Invalid webhook signature')
  }

  switch (event.type) {
    case 'organization.created': {
      await prisma.client.create({
        data: {
          name: event.data.name,
          slug: event.data.slug,
          clerkOrgId: event.data.id,
          status: 'ACTIVE',
        },
      })
      break
    }

    case 'organization.updated': {
      await prisma.client.update({
        where: { clerkOrgId: event.data.id },
        data: {
          name: event.data.name,
          slug: event.data.slug,
        },
      })
      break
    }

    case 'organization.deleted': {
      await prisma.client.update({
        where: { clerkOrgId: event.data.id },
        data: { status: 'INACTIVE' },
      })
      break
    }

    case 'organizationMembership.created': {
      const client = await prisma.client.findUnique({
        where: { clerkOrgId: event.data.organization.id },
      })
      if (client) {
        const role = mapClerkRole(event.data.role)
        await prisma.clientUser.create({
          data: {
            clerkUserId: event.data.public_user_data.user_id,
            clientId: client.id,
            role,
          },
        })
      }
      break
    }

    case 'organizationMembership.updated': {
      const clientForUpdate = await prisma.client.findUnique({
        where: { clerkOrgId: event.data.organization.id },
      })
      if (clientForUpdate) {
        const role = mapClerkRole(event.data.role)
        await prisma.clientUser.updateMany({
          where: {
            clerkUserId: event.data.public_user_data.user_id,
            clientId: clientForUpdate.id,
          },
          data: { role },
        })
      }
      break
    }

    case 'organizationMembership.deleted': {
      const clientForDelete = await prisma.client.findUnique({
        where: { clerkOrgId: event.data.organization.id },
      })
      if (clientForDelete) {
        await prisma.clientUser.deleteMany({
          where: {
            clerkUserId: event.data.public_user_data.user_id,
            clientId: clientForDelete.id,
          },
        })
      }
      break
    }
  }

  return { success: true }
}

function mapClerkRole(clerkRole: string): 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_VIEWER' {
  switch (clerkRole) {
    case 'org:admin':
      return 'CLIENT_ADMIN'
    case 'org:member':
      return 'CLIENT_USER'
    default:
      return 'CLIENT_VIEWER'
  }
}
