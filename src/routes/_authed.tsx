import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    // Allow guests through — individual routes handle their own auth requirements.
    // Demo org routes permit unauthenticated access; other routes check auth themselves.
    return { isGuest: !context.userId }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Not authenticated') {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <SignIn routing="hash" />
        </div>
      )
    }

    const isOrgError =
      error.message === 'No organization selected' ||
      error.message === 'Organization is not active' ||
      error.message === 'Not a member of this organization'

    if (isOrgError) {
      return <RedirectToOnboarding />
    }

    throw error
  },
  component: () => <Outlet />,
})

function RedirectToOnboarding() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/onboarding' })
  }, [navigate])
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  )
}
