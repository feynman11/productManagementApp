import { createFileRoute } from '@tanstack/react-router'
import { Settings, Bell, Palette, Shield } from 'lucide-react'

export const Route = createFileRoute('/_authed/$orgSlug/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { orgSlug } = Route.useParams()
  const parentData = Route.useRouteContext()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization settings and preferences.
        </p>
      </div>

      {/* Organization info card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Organization
            </h3>
            <p className="text-sm text-muted-foreground">
              General organization information
            </p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
              Organization Slug
            </dt>
            <dd className="text-sm font-mono text-foreground">{orgSlug}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
              Your Role
            </dt>
            <dd className="text-sm text-foreground">
              <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                Member
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Upcoming settings sections */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Palette className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground">Branding</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize your organization's logo, colors, and branding. Coming
            soon.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground">Notifications</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure email and in-app notification preferences. Coming soon.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground">Security</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage authentication policies, SSO, and access controls. Coming
            soon.
          </p>
        </div>
      </div>
    </div>
  )
}
