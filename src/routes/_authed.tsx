import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw new Error('Not authenticated')
    }
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
      error.message === 'Client not found or inactive'

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
