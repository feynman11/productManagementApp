import { useState } from 'react'
import { UserButton, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { Menu, Eye, LogIn, ShieldCheck } from 'lucide-react'
import { AppSidebar } from '~/components/layouts/app-sidebar'
import { OrgSwitcher } from '~/components/common/org-switcher'
import { ThemeToggle } from '~/components/common/theme-toggle'
import { NotificationBell } from '~/components/common/notification-bell'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'

interface OrgInfo {
  id: string
  name: string
  slug: string
  isDemo: boolean
  role: string
}

interface AppLayoutProps {
  orgSlug: string
  isDemo?: boolean
  isGuest?: boolean
  isSuperAdmin?: boolean
  userOrgs: OrgInfo[]
  children: React.ReactNode
}

export function AppLayout({ orgSlug, isDemo, isGuest, isSuperAdmin, userOrgs, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        orgSlug={orgSlug}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {isGuest ? (
              <span className="text-sm font-medium text-foreground">Demo</span>
            ) : (
              <OrgSwitcher currentSlug={orgSlug} orgs={userOrgs} />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDemo && (
              <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                <Eye className="h-3 w-3" />
                Read-only demo
              </Badge>
            )}
            {isGuest ? (
              <>
                <ThemeToggle />
                <Separator orientation="vertical" className="h-6 mx-1" />
                <SignInButton mode="modal">
                  <Button variant="default" size="sm" className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </Button>
                </SignInButton>
              </>
            ) : (
              <>
                <NotificationBell />
                {isSuperAdmin && (
                  <Link to="/super-admin/clients" search={{ page: 1 }}>
                    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Super Admin">
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <ThemeToggle />
                <Separator orientation="vertical" className="h-6 mx-1" />
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8 rounded-lg',
                    },
                  }}
                />
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
