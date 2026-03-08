import { createFileRoute, Link } from '@tanstack/react-router'
import { Sparkles, Building2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { getUserContext } from '~/server/functions/auth'

export const Route = createFileRoute('/_authed/onboarding')({
  beforeLoad: ({ context }) => {
    if (context.isGuest) {
      throw new Error('Not authenticated')
    }
  },
  loader: () => getUserContext(),
  component: OnboardingPage,
})

function OnboardingPage() {
  const ctx = Route.useLoaderData()
  const orgs = ctx.authenticated ? ctx.orgs : []

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 h-72 w-72 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-none bg-transparent shadow-none">
        <CardHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient shadow-lg mb-2">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl tracking-tight font-heading">
            Welcome to ProductPlan
          </CardTitle>
          <CardDescription className="max-w-sm">
            {orgs.length > 0
              ? 'Select an organization to get started.'
              : 'You haven\'t been assigned to any organization yet. Please contact your administrator.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length > 0 ? (
            <div className="space-y-2">
              {orgs.map((org) => (
                <Link
                  key={org.id}
                  to="/$orgSlug"
                  params={{ orgSlug: org.slug }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {org.isDemo && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Eye className="h-3 w-3" />
                        Demo
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {org.role}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No organizations available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
