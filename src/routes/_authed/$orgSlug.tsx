import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { AppLayout } from '~/components/layouts/app-layout'
import { requireClientAuth } from '~/lib/auth.server'
import { prisma } from '~/lib/prisma'

const getClientBySlug = createServerFn({ method: 'GET' }).handler(async () => {
  const { clientId, clientUserRole, userId } = await requireClientAuth()

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, status: true },
  })

  if (!client) {
    throw new Error('Client not found')
  }

  return { client, clientId, clientUserRole, userId }
})

export const Route = createFileRoute('/_authed/$orgSlug')({
  loader: async () => {
    try {
      return await getClientBySlug()
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'No organization selected' ||
          error.message === 'Client not found or inactive' ||
          error.message === 'Client not found')
      ) {
        throw redirect({ to: '/onboarding' })
      }
      throw error
    }
  },
  component: OrgLayout,
})

function OrgLayout() {
  const { orgSlug } = Route.useParams()

  return (
    <AppLayout orgSlug={orgSlug}>
      <Outlet />
    </AppLayout>
  )
}
