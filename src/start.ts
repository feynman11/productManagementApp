import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createMiddleware, json } from '@tanstack/react-start'
import { createStart } from '@tanstack/react-start'
import { processClerkWebhook } from '~/server/webhooks/clerk'

const webhookMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url)
  if (url.pathname === '/api/webhooks/clerk' && request.method === 'POST') {
    try {
      const result = await processClerkWebhook(request)
      throw json(result, { status: 200 })
    } catch (error) {
      if (error instanceof Response) throw error
      const message =
        error instanceof Error ? error.message : 'Webhook processing failed'
      const status = message === 'Missing svix headers' ? 400 : 500
      throw json({ error: message }, { status })
    }
  }
  return next()
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [webhookMiddleware, clerkMiddleware()],
  }
})
