import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { ThemeToggle } from '~/components/common/theme-toggle'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { getUserContext } from '~/server/functions/auth'

export const Route = createFileRoute('/_authed/super-admin')({
  beforeLoad: async () => {
    const ctx = await getUserContext()
    if (!ctx.authenticated || !ctx.isSuperAdmin) {
      throw redirect({ to: '/' })
    }
    return { isSuperAdmin: true }
  },
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
          <Badge variant="destructive" className="text-[10px]">
            Super Admin
          </Badge>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            to="/super-admin/clients"
            search={{ page: 1 }}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground font-medium' }}
          >
            Clients
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <ThemeToggle />
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
