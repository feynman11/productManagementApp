import { Link, useRouter } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '~/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function getNavItems(orgSlug: string): NavItem[] {
  return [
    {
      label: 'Dashboard',
      href: `/${orgSlug}`,
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      href: `/${orgSlug}/products`,
      icon: Package,
    },
    {
      label: 'Settings',
      href: `/${orgSlug}/settings`,
      icon: Settings,
    },
  ]
}

interface AppSidebarProps {
  orgSlug: string
  isOpen: boolean
  onClose: () => void
}

export function AppSidebar({ orgSlug, isOpen, onClose }: AppSidebarProps) {
  const router = useRouter()
  const currentPath = router.state.location.pathname
  const navItems = getNavItems(orgSlug)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar lg:static lg:z-auto',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/$orgSlug"
            params={{ orgSlug }}
            className="flex items-center gap-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
              <Package className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">
              ProductPlan
            </span>
          </Link>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = item.href === `/${orgSlug}`
              ? currentPath === item.href || currentPath === `${item.href}/`
              : currentPath.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50">
            ProductPlan v0.1.0
          </p>
        </div>
      </aside>
    </>
  )
}
