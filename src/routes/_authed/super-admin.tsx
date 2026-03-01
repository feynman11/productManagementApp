import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '~/components/common/theme-toggle'

export const Route = createFileRoute('/_authed/super-admin')({
  component: SuperAdminLayout,
})

function SuperAdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">ProductPlan</h1>
          </Link>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Super Admin
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/super-admin/clients"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground font-medium' }}
          >
            Clients
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
