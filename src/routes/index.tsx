import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.userId && context.orgSlug) {
      throw redirect({ to: '/$orgSlug', params: { orgSlug: context.orgSlug } })
    }
    if (context.userId && !context.orgSlug) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold tracking-tight">ProductPlan</h1>
      <p className="text-muted-foreground">
        Multi-tenant product management platform
      </p>
      <SignedIn>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  )
}
