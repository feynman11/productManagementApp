import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/roadmap',
)({
  component: RoadmapLayout,
})

function RoadmapLayout() {
  return <Outlet />
}
