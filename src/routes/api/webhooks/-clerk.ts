// Clerk webhook handler
// This file is excluded from the route tree (prefixed with -)
// TODO: Wire up as an API endpoint when TanStack Start adds API route support,
// or handle via a custom server middleware.

export { processClerkWebhook } from '~/server/webhooks/clerk'
