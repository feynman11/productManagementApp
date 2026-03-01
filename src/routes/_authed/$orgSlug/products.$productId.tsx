import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Lightbulb,
  Map,
  AlertCircle,
  Pencil,
  Archive,
  Check,
  X,
  Users,
  Target,
  Eye,
} from 'lucide-react'
import { getProduct, updateProduct, archiveProduct } from '~/server/functions/products'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite, canAdmin } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_authed/$orgSlug/products/$productId')({
  loader: ({ params }) => getProduct({ data: { productId: params.productId } }),
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)
  const userCanAdmin = canAdmin(parentData.clientUserRole as any)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState(product.name)
  const [editDescription, setEditDescription] = useState(
    product.description ?? '',
  )
  const [editVision, setEditVision] = useState(product.vision ?? '')
  const [editStrategy, setEditStrategy] = useState(product.strategy ?? '')

  // Determine active tab from router state (SSR-safe)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isIdeasTab = currentPath.includes('/ideas')
  const isRoadmapTab = currentPath.includes('/roadmap')
  const isIssuesTab = currentPath.includes('/issues')
  const isOverview = !isIdeasTab && !isRoadmapTab && !isIssuesTab

  async function handleSaveEdit() {
    setSaving(true)
    try {
      await updateProduct({
        data: {
          productId,
          name: editName,
          description: editDescription || undefined,
          vision: editVision || undefined,
          strategy: editStrategy || undefined,
        },
      })
      setEditing(false)
      navigate({
        to: '/$orgSlug/products/$productId',
        params: { orgSlug, productId },
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!confirm('Are you sure you want to archive this product?')) return
    try {
      await archiveProduct({ data: { productId } })
      navigate({ to: '/$orgSlug/products', params: { orgSlug } })
    } catch {
      // Error handling can be enhanced with toasts
    }
  }

  const tabs = [
    {
      label: 'Overview',
      href: `/${orgSlug}/products/${productId}`,
      isActive: isOverview,
      icon: Eye,
    },
    {
      label: 'Ideas',
      href: `/${orgSlug}/products/${productId}/ideas`,
      isActive: isIdeasTab,
      icon: Lightbulb,
    },
    {
      label: 'Roadmap',
      href: `/${orgSlug}/products/${productId}/roadmap`,
      isActive: isRoadmapTab,
      icon: Map,
    },
    {
      label: 'Issues',
      href: `/${orgSlug}/products/${productId}/issues`,
      isActive: isIssuesTab,
      icon: AlertCircle,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              navigate({ to: '/$orgSlug/products', params: { orgSlug } })
            }
            className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: product.color }}
              />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {product.name}
              </h2>
              <StatusBadge status={product.status} />
            </div>
            {product.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {userCanWrite && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {userCanAdmin && product.status !== 'ARCHIVED' && (
            <button
              onClick={handleArchive}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.label}
                to={tab.href}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors whitespace-nowrap',
                  tab.isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      {isOverview ? (
        <div className="space-y-6">
          {/* Inline edit form */}
          {editing ? (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Edit Product
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editName.trim()}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Vision
                  </label>
                  <textarea
                    value={editVision}
                    onChange={(e) => setEditVision(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Strategy
                  </label>
                  <textarea
                    value={editStrategy}
                    onChange={(e) => setEditStrategy(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Vision & Strategy */}
              {(product.vision || product.strategy) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {product.vision && (
                    <div className="rounded-lg border border-border bg-card p-5">
                      <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                        Vision
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {product.vision}
                      </p>
                    </div>
                  )}
                  {product.strategy && (
                    <div className="rounded-lg border border-border bg-card p-5">
                      <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                        Strategy
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {product.strategy}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  to="/$orgSlug/products/$productId/ideas" params={{ orgSlug, productId }}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">
                        {product._count.ideas}
                      </p>
                      <p className="text-xs text-muted-foreground">Ideas</p>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/$orgSlug/products/$productId/roadmap" params={{ orgSlug, productId }}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">
                        {product._count.roadmaps}
                      </p>
                      <p className="text-xs text-muted-foreground">Roadmaps</p>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/$orgSlug/products/$productId/issues" params={{ orgSlug, productId }}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">
                        {product._count.issues}
                      </p>
                      <p className="text-xs text-muted-foreground">Issues</p>
                    </div>
                  </div>
                </Link>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">
                        {product._count.members}
                      </p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members */}
              {product.members && product.members.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      Team Members
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {product.members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <span className="text-sm text-foreground font-mono">
                          {member.clerkUserId.slice(0, 12)}...
                        </span>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            member.role === 'LEAD'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                              : 'bg-secondary text-secondary-foreground',
                          )}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {product.goals && product.goals.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      Goals
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {product.goals.map((goal: any) => {
                      const progress =
                        goal.targetValue && goal.currentValue
                          ? Math.min(
                              100,
                              Math.round(
                                (goal.currentValue / goal.targetValue) * 100,
                              ),
                            )
                          : null
                      return (
                        <div
                          key={goal.id}
                          className="rounded-md border border-border p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">
                              {goal.title}
                            </h4>
                            {progress != null && (
                              <span className="text-xs font-medium text-muted-foreground">
                                {progress}%
                              </span>
                            )}
                          </div>
                          {goal.description && (
                            <p className="mb-2 text-xs text-muted-foreground">
                              {goal.description}
                            </p>
                          )}
                          {progress != null && (
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
