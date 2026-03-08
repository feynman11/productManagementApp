import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import {
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/tanstack-react-start'
import { Sparkles, ArrowRight, Package, Lightbulb, Map, AlertCircle, Eye } from 'lucide-react'
import { getUserContext, getDemoOrgSlug } from '~/server/functions/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    if (!context.userId) return

    const ctx = await getUserContext()
    if (!ctx.authenticated) return

    // Redirect to active org, first org, or onboarding
    if (ctx.activeOrgSlug) {
      throw redirect({ to: '/$orgSlug', params: { orgSlug: ctx.activeOrgSlug } })
    }
    if (ctx.orgs.length > 0) {
      throw redirect({ to: '/$orgSlug', params: { orgSlug: ctx.orgs[0].slug } })
    }
    throw redirect({ to: '/onboarding' })
  },
  loader: async () => {
    const { slug } = await getDemoOrgSlug()
    return { demoOrgSlug: slug }
  },
  component: HomePage,
})

function HomePage() {
  const { demoOrgSlug } = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="flex flex-col items-center gap-8 px-4 text-center">
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground font-heading sm:text-5xl">
            ProductPlan
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The modern product management platform for ambitious teams.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: Package, label: 'Products', color: 'text-blue-500' },
            { icon: Lightbulb, label: 'Ideas', color: 'text-amber-500' },
            { icon: Map, label: 'Roadmaps', color: 'text-emerald-500' },
            { icon: AlertCircle, label: 'Issues', color: 'text-red-500' },
          ].map((feature) => {
            const Icon = feature.icon
            return (
              <span
                key={feature.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3.5 py-1.5 text-sm font-medium text-foreground"
              >
                <Icon className={`h-3.5 w-3.5 ${feature.color}`} />
                {feature.label}
              </span>
            )
          })}
        </div>

        {/* Auth */}
        <SignedIn>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Redirecting...
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center gap-3">
            <SignInButton mode="modal">
              <button className="btn-primary h-12 px-8 text-base gap-2 shadow-lg hover:shadow-xl transition-shadow">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>
            {demoOrgSlug && (
              <Link
                to="/$orgSlug"
                params={{ orgSlug: demoOrgSlug }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Try the demo
              </Link>
            )}
          </div>
        </SignedOut>
      </div>
    </div>
  )
}
