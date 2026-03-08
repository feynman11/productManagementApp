import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Settings,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
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
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const navItems = getNavItems(orgSlug)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar lg:static lg:z-auto',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            to="/$orgSlug"
            params={{ orgSlug }}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-sidebar-foreground tracking-tight font-heading">
              ProductPlan
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 pt-2">
          <div className="mb-3 px-3">
            <p className="section-title text-sidebar-foreground/40 text-[10px]">
              Navigation
            </p>
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const normalizedHref = item.href.endsWith('/') ? item.href : `${item.href}/`
              const normalizedPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`

              const isActive = item.href === `/${orgSlug}`
                ? currentPath === item.href || currentPath === `${item.href}/`
                : normalizedPath.startsWith(normalizedHref)

              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  )}
                >
                  <Icon className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary' : '',
                  )} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <Separator className="bg-sidebar-border" />
        <div className="px-5 py-4">
          <p className="text-[11px] text-sidebar-foreground/30 font-medium">
            ProductPlan v0.1.0
          </p>
        </div>
      </aside>
    </>
  )
}
