import { createFileRoute, redirect } from '@tanstack/react-router'

// Super admin login is now handled via Clerk + isSuperAdmin flag.
// Redirect any old links to the super admin panel.
export const Route = createFileRoute('/_authed/super-admin/login')({
  beforeLoad: () => {
    throw redirect({ to: '/super-admin/clients', search: { page: 1 } })
  },
})
