import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/$orgSlug/products')({
  component: ProductsLayout,
})

function ProductsLayout() {
  return <Outlet />
}
