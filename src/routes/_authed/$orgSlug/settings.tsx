import { createFileRoute } from '@tanstack/react-router'
import { Settings, Bell, Palette, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/_authed/$orgSlug/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { orgSlug } = Route.useParams()
  const { role, isDemo } = Route.useRouteContext()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-heading">Settings</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your organization settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-tint">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading">Organization</CardTitle>
              <CardDescription>General organization information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4">
              <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Organization Slug
              </dt>
              <dd className="text-sm font-mono font-medium text-foreground">{orgSlug}</dd>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Your Role
              </dt>
              <dd>
                <Badge className="bg-primary/10 text-primary">
                  {role}
                </Badge>
                {isDemo && (
                  <Badge variant="secondary" className="ml-2">
                    Read-only
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: Palette,
            title: 'Branding',
            description: 'Customize your organization\'s logo, colors, and branding.',
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
          },
          {
            icon: Bell,
            title: 'Notifications',
            description: 'Configure email and in-app notification preferences.',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          {
            icon: Shield,
            title: 'Security',
            description: 'Manage authentication policies and access controls.',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
        ].map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.title}
              className="border-2 border-dashed border-border/50 bg-card/50"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${section.bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${section.color}`} />
                  </div>
                  <CardTitle className="font-heading">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
                <p className="mt-3 text-xs font-medium text-muted-foreground/60">
                  Coming soon
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
