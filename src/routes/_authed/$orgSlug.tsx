import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppLayout } from '~/components/layouts/app-layout'
import { requireClientAuth } from '~/lib/auth.server'
import { prisma } from '~/lib/prisma'
import { switchOrg, getUserOrgs } from '~/server/functions/clients'

const getClientBySlug = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { clientId, role, isDemo, isGuest, appUser } = await requireClientAuth({ slug: data.slug })

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, slug: true, status: true, isDemo: true },
    })

    if (!client) throw new Error('Client not found')

    return { client, clientId, role, isDemo, isGuest, isSuperAdmin: appUser?.isSuperAdmin ?? false }
  })

export const Route = createFileRoute('/_authed/$orgSlug')({
  beforeLoad: async ({ params, context }) => {
    try {
      const data = await getClientBySlug({ data: { slug: params.orgSlug } })

      // Non-demo orgs require authentication
      if (!data.isDemo && context.isGuest) {
        throw new Error('Not authenticated')
      }

      let userOrgs: Awaited<ReturnType<typeof getUserOrgs>> = []
      let isSuperAdmin = false

      if (!data.isGuest) {
        // Set this org as the user's active org (authenticated users only)
        await switchOrg({ data: { slug: params.orgSlug } })
        userOrgs = await getUserOrgs()
        isSuperAdmin = data.isSuperAdmin
      }

      return {
        role: data.role,
        clientId: data.clientId,
        isDemo: data.isDemo,
        isGuest: data.isGuest,
        isSuperAdmin,
        userOrgs,
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Not authenticated') {
        throw error
      }
      if (
        error instanceof Error &&
        (error.message === 'No organization selected' ||
          error.message === 'Organization is not active' ||
          error.message === 'Not a member of this organization' ||
          error.message === 'Client not found' ||
          error.message === 'Organization not found')
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
  const { isDemo, isGuest, isSuperAdmin, userOrgs } = Route.useRouteContext()

  return (
    <AppLayout orgSlug={orgSlug} isDemo={isDemo} isGuest={isGuest} isSuperAdmin={isSuperAdmin} userOrgs={userOrgs}>
      <Outlet />
    </AppLayout>
  )
}
