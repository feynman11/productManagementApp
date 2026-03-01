import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Package, Lightbulb, Map, AlertCircle } from 'lucide-react'
import { requireClientAuth } from '~/lib/auth.server'
import { prisma } from '~/lib/prisma'

const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { clientId } = await requireClientAuth()

    const [
      productCount,
      activeProducts,
      ideaCount,
      roadmapItemCount,
      issueCount,
      openIssues,
    ] = await Promise.all([
      prisma.product.count({ where: { clientId } }),
      prisma.product.count({ where: { clientId, status: 'ACTIVE' } }),
      prisma.idea.count({ where: { clientId } }),
      prisma.roadmapItem.count({ where: { roadmap: { clientId } } }),
      prisma.issue.count({ where: { clientId } }),
      prisma.issue.count({ where: { clientId, status: 'OPEN' } }),
    ])

    return {
      productCount,
      activeProducts,
      ideaCount,
      roadmapItemCount,
      issueCount,
      openIssues,
    }
  },
)

export const Route = createFileRoute('/_authed/$orgSlug/')({
  loader: () => getDashboardStats(),
  component: DashboardPage,
})

interface StatCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  iconColorClass: string
  iconBgClass: string
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  iconColorClass,
  iconBgClass,
}: StatCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgClass}`}
        >
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
      </div>
    </Link>
  )
}

function DashboardPage() {
  const stats = Route.useLoaderData()
  const { orgSlug } = Route.useParams()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your product management workspace.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          subtitle={`${stats.productCount} total products`}
          icon={Package}
          href={`/${orgSlug}/products`}
          iconColorClass="text-blue-600 dark:text-blue-400"
          iconBgClass="bg-blue-500/10"
        />
        <StatCard
          title="Total Ideas"
          value={stats.ideaCount}
          subtitle="Across all products"
          icon={Lightbulb}
          href={`/${orgSlug}/products`}
          iconColorClass="text-amber-600 dark:text-amber-400"
          iconBgClass="bg-amber-500/10"
        />
        <StatCard
          title="Roadmap Items"
          value={stats.roadmapItemCount}
          subtitle="Planned and in progress"
          icon={Map}
          href={`/${orgSlug}/products`}
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-500/10"
        />
        <StatCard
          title="Open Issues"
          value={stats.openIssues}
          subtitle={`${stats.issueCount} total issues`}
          icon={AlertCircle}
          href={`/${orgSlug}/products`}
          iconColorClass="text-red-600 dark:text-red-400"
          iconBgClass="bg-red-500/10"
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-card-foreground">
          Quick Actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/$orgSlug/products" params={{ orgSlug }}
            className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Manage Products
          </Link>
          <Link
            to="/$orgSlug/products" params={{ orgSlug }}
            className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            View Ideas
          </Link>
          <Link
            to="/$orgSlug/products" params={{ orgSlug }}
            className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            View Roadmap
          </Link>
          <Link
            to="/$orgSlug/products" params={{ orgSlug }}
            className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            Track Issues
          </Link>
        </div>
      </div>
    </div>
  )
}
