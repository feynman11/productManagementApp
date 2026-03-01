import { createFileRoute } from '@tanstack/react-router'
import { OrganizationList } from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/_authed/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to ProductPlan
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new team or select one you've been invited to.
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/:slug"
        afterSelectOrganizationUrl="/:slug"
      />
    </div>
  )
}
