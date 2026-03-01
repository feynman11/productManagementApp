import { useState } from 'react'
import { UserButton, OrganizationSwitcher } from '@clerk/tanstack-react-start'
import { Menu } from 'lucide-react'
import { AppSidebar } from '~/components/layouts/app-sidebar'
import { ThemeToggle } from '~/components/common/theme-toggle'
import { cn } from '~/lib/utils'

interface AppLayoutProps {
  orgSlug: string
  children: React.ReactNode
}

export function AppLayout({ orgSlug, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AppSidebar
        orgSlug={orgSlug}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          {/* Left side: hamburger + org switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden',
              )}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/:slug"
              afterCreateOrganizationUrl="/:slug"
              appearance={{
                elements: {
                  rootBox: 'flex items-center',
                },
              }}
            />
          </div>

          {/* Right side: theme toggle + user button */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
