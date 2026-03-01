import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/issues',
)({
  component: IssuesLayout,
})

function IssuesLayout() {
  return <Outlet />
}
