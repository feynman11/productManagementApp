import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/ideas',
)({
  component: IdeasLayout,
})

function IdeasLayout() {
  return <Outlet />
}
