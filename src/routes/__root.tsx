import { ClerkProvider } from '@clerk/tanstack-react-start'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { ThemeProvider } from '~/components/theme-provider'
import appCss from '~/styles/app.css?url'

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId, orgId, orgSlug } = await auth()
  return { userId, orgId: orgId ?? null, orgSlug: orgSlug ?? null }
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ProductPlan' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: async () => {
    const { userId, orgId, orgSlug } = await fetchClerkAuth()
    return { userId, orgId, orgSlug }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <ClerkProvider>
      <ThemeProvider defaultTheme="system" storageKey="productplan-theme">
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ThemeProvider>
    </ClerkProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
