import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  Package,
  Lightbulb,
  AlertCircle,
  Rocket,
  Plus,
  X,
  Layers,
} from 'lucide-react'
import { requireClientAuth } from '~/lib/auth.server'
import { prisma } from '~/lib/prisma'
import { cn } from '~/lib/utils'
import { createIdea } from '~/server/functions/ideas'
import { addFeatureToProduct } from '~/server/functions/roadmap'
import { createIssue } from '~/server/functions/issues'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'

// ──────────────────────────────────────────────────────
// Server function — enriched dashboard data
// ──────────────────────────────────────────────────────

const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { clientId } = await requireClientAuth()

    const [products, counts] = await Promise.all([
      prisma.product.findMany({
        where: { clientId, status: 'ACTIVE' },
        include: {
          _count: { select: { ideas: true, issues: true } },
          roadmaps: {
            include: {
              _count: { select: { items: true } },
              items: {
                where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                select: { id: true, title: true, status: true },
              },
              releases: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  name: true,
                  status: true,
                  targetDate: true,
                  roadmapId: true,
                },
              },
            },
          },
          issues: {
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            select: { severity: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      Promise.all([
        prisma.product.count({ where: { clientId } }),
        prisma.product.count({ where: { clientId, status: 'ACTIVE' } }),
        prisma.idea.count({ where: { clientId } }),
        prisma.roadmapItem.count({ where: { roadmap: { clientId }, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
        prisma.issue.count({ where: { clientId } }),
        prisma.issue.count({ where: { clientId, status: 'OPEN' } }),
      ]),
    ])

    const [
      totalProducts,
      activeProducts,
      totalIdeas,
      activeFeatures,
      totalIssues,
      openIssues,
    ] = counts

    const enrichedProducts = products.map((product) => {
      const allActiveItems = product.roadmaps.flatMap((r) => r.items)
      const allInProgress = allActiveItems.filter((i) => i.status === 'IN_PROGRESS')
      const inProgressItems = allInProgress.slice(0, 3)
      const inProgressTotal = allInProgress.length

      const allReleases = product.roadmaps.flatMap((r) => r.releases)
      const latestRelease =
        allReleases.sort((a, b) => {
          const aTime = a.targetDate
            ? new Date(a.targetDate).getTime()
            : 0
          const bTime = b.targetDate
            ? new Date(b.targetDate).getTime()
            : 0
          return bTime - aTime
        })[0] ?? null

      const severityCounts: Record<string, number> = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      }
      product.issues.forEach((i) => {
        severityCounts[i.severity]++
      })

      const { roadmaps, issues, ...base } = product

      return {
        ...base,
        inProgressItems,
        inProgressTotal,
        latestRelease,
        openIssueCount: product.issues.length,
        severityCounts,
        featureCount: product.roadmaps.reduce(
          (sum, r) => sum + r._count.items,
          0,
        ),
        activeFeatureCount: allActiveItems.length,
      }
    })

    return {
      products: enrichedProducts,
      stats: {
        totalProducts,
        activeProducts,
        totalIdeas,
        activeFeatures,
        totalIssues,
        openIssues,
      },
    }
  },
)

// ──────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────

export const Route = createFileRoute('/_authed/$orgSlug/')({
  loader: () => getDashboardData(),
  component: DashboardPage,
})

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
type DashboardProduct = DashboardData['products'][number]

type QuickAction = 'idea' | 'feature' | 'issue'
type ActiveForm = { productId: string; type: QuickAction } | null

// ──────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────

const statItems = [
  {
    key: 'products',
    icon: Package,
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'ideas',
    icon: Lightbulb,
    iconBg: 'bg-amber-500/10 dark:bg-amber-400/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'features',
    icon: Layers,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'issues',
    icon: AlertCircle,
    iconBg: 'bg-red-500/10 dark:bg-red-400/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
] as const

const releaseStatusStyles: Record<string, string> = {
  PLANNED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  RELEASED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-muted text-muted-foreground',
}

const severityConfig = [
  { key: 'CRITICAL', color: 'bg-red-500', label: 'Crit' },
  { key: 'HIGH', color: 'bg-orange-500', label: 'High' },
  { key: 'MEDIUM', color: 'bg-amber-400', label: 'Med' },
  { key: 'LOW', color: 'bg-slate-400 dark:bg-slate-500', label: 'Low' },
]

function formatStatus(status: string) {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

// ──────────────────────────────────────────────────────
// Quick-action forms
// ──────────────────────────────────────────────────────

function QuickIdeaForm({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createIdea({
        data: { productId, title, description },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create idea')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="What's the idea?"
          className="h-8 text-xs"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={2}
          placeholder="Describe the idea..."
          className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="xs"
          disabled={submitting || !title.trim() || !description.trim()}
        >
          {submitting ? 'Saving...' : 'Submit Idea'}
        </Button>
      </div>
    </form>
  )
}

function QuickFeatureForm({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await addFeatureToProduct({
        data: { productId, title, description: description || undefined },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add feature')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="e.g., User authentication"
          className="h-8 text-xs"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Describe the feature..."
          className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="xs"
          disabled={submitting || !title.trim()}
        >
          {submitting ? 'Adding...' : 'Add Feature'}
        </Button>
      </div>
    </form>
  )
}

function QuickIssueForm({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createIssue({
        data: {
          productId,
          title,
          description,
          severity: severity as any,
        },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="Briefly describe the issue"
          className="h-8 text-xs"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={2}
          placeholder="Steps to reproduce, expected vs actual..."
          className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Severity
        </label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger size="sm" className="text-xs w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="xs"
          disabled={submitting || !title.trim() || !description.trim()}
        >
          {submitting ? 'Logging...' : 'Log Issue'}
        </Button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
  sublabel,
  href,
  iconBg,
  iconColor,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  sublabel: string
  href: string
  iconBg: string
  iconColor: string
  index: number
}) {
  return (
    <Link
      to={href}
      style={{ animation: `dash-fade-in 0.35s ease-out ${index * 0.05}s both` }}
    >
      <Card className="group flex-row items-center gap-3.5 p-4 cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md py-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ml-2',
            iconBg,
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold font-heading tabular-nums leading-none">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </Card>
    </Link>
  )
}

function ProductCard({
  product,
  orgSlug,
  index,
  activeForm,
  onSetForm,
}: {
  product: DashboardProduct
  orgSlug: string
  index: number
  activeForm: QuickAction | null
  onSetForm: (type: QuickAction | null) => void
}) {
  const router = useRouter()

  function handleSuccess() {
    onSetForm(null)
    router.invalidate()
  }

  return (
    <Card
      className="overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-primary/15 py-0 gap-0"
      style={{
        animation: `dash-fade-in 0.4s ease-out ${(index + 4) * 0.06}s both`,
      }}
    >
      {/* Product color accent */}
      <div className="h-1 w-full" style={{ backgroundColor: product.color }} />

      <div className="p-5 space-y-4">
        {/* Header: icon + name */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-heading font-bold text-sm"
            style={{ backgroundColor: product.color }}
          >
            {product.icon || product.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to="/$orgSlug/products/$productId"
              params={{ orgSlug, productId: product.id }}
              className="font-heading font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {product.name}
            </Link>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* In Progress items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">In Progress</span>
            {product.inProgressTotal > 0 && (
              <span className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                {product.inProgressTotal}
              </span>
            )}
          </div>
          {product.inProgressItems.length > 0 ? (
            <div className="space-y-1.5">
              {product.inProgressItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-foreground/80"
                >
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="truncate">{item.title}</span>
                </div>
              ))}
              {product.inProgressTotal > 3 && (
                <Link
                  to="/$orgSlug/products/$productId/roadmap"
                  params={{ orgSlug, productId: product.id }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors pl-3.5"
                >
                  +{product.inProgressTotal - 3} more
                </Link>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              No items in progress
            </p>
          )}
        </div>

        {/* Latest Release */}
        <div>
          <span className="section-title">Latest Release</span>
          {product.latestRelease ? (
            <Link
              to="/$orgSlug/products/$productId/roadmap/$roadmapId"
              params={{
                orgSlug,
                productId: product.id,
                roadmapId: product.latestRelease.roadmapId,
              }}
              className="mt-2 flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60 hover:border-border/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Rocket className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {product.latestRelease.name}
                </span>
              </div>
              <span
                className={cn(
                  'badge text-[10px] shrink-0 ml-2',
                  releaseStatusStyles[product.latestRelease.status] ??
                    'bg-muted text-muted-foreground',
                )}
              >
                {formatStatus(product.latestRelease.status)}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground/60 italic">
              No releases yet
            </p>
          )}
        </div>

        {/* Issues severity breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">Issues</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {product.openIssueCount} open
            </span>
          </div>
          {product.openIssueCount > 0 ? (
            <div className="flex items-center gap-4">
              {severityConfig.map(({ key, color, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn('h-2.5 w-2.5 rounded-[3px]', color)} />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {product.severityCounts[key] ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All clear
            </div>
          )}
        </div>

        {/* Quick-action inline form */}
        {activeForm && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-foreground font-heading">
                {activeForm === 'idea' && 'New Idea'}
                {activeForm === 'feature' && 'New Feature'}
                {activeForm === 'issue' && 'Log Issue'}
              </h4>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onSetForm(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {activeForm === 'idea' && (
              <QuickIdeaForm
                productId={product.id}
                onClose={() => onSetForm(null)}
                onSuccess={handleSuccess}
              />
            )}
            {activeForm === 'feature' && (
              <QuickFeatureForm
                productId={product.id}
                onClose={() => onSetForm(null)}
                onSuccess={handleSuccess}
              />
            )}
            {activeForm === 'issue' && (
              <QuickIssueForm
                productId={product.id}
                onClose={() => onSetForm(null)}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        )}

        {/* Nav links + quick-add buttons */}
        <div className="border-t border-border/40 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1">
              <Link
                to="/$orgSlug/products/$productId/ideas"
                params={{ orgSlug, productId: product.id }}
                className="group/nav flex flex-col items-center gap-1 rounded-lg py-2 px-1 w-full transition-colors hover:bg-amber-500/8"
              >
                <Lightbulb className="h-4 w-4 text-amber-500/70 group-hover/nav:text-amber-500 transition-colors" />
                <span className="text-xs font-semibold tabular-nums">
                  {product._count.ideas}
                </span>
                <span className="text-[10px] text-muted-foreground">Ideas</span>
              </Link>
              <button
                onClick={() => onSetForm(activeForm === 'idea' ? null : 'idea')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  activeForm === 'idea'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground hover:bg-amber-500/8 hover:text-amber-600 dark:hover:text-amber-400',
                )}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Link
                to="/$orgSlug/products/$productId/features"
                params={{ orgSlug, productId: product.id }}
                className="group/nav flex flex-col items-center gap-1 rounded-lg py-2 px-1 w-full transition-colors hover:bg-emerald-500/8"
              >
                <Layers className="h-4 w-4 text-emerald-500/70 group-hover/nav:text-emerald-500 transition-colors" />
                <span className="text-xs font-semibold tabular-nums">
                  {product.activeFeatureCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Features
                </span>
              </Link>
              <button
                onClick={() => onSetForm(activeForm === 'feature' ? null : 'feature')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  activeForm === 'feature'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-emerald-500/8 hover:text-emerald-600 dark:hover:text-emerald-400',
                )}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Link
                to="/$orgSlug/products/$productId/issues"
                params={{ orgSlug, productId: product.id }}
                className="group/nav flex flex-col items-center gap-1 rounded-lg py-2 px-1 w-full transition-colors hover:bg-red-500/8"
              >
                <AlertCircle className="h-4 w-4 text-red-500/70 group-hover/nav:text-red-500 transition-colors" />
                <span className="text-xs font-semibold tabular-nums">
                  {product._count.issues}
                </span>
                <span className="text-[10px] text-muted-foreground">Issues</span>
              </Link>
              <button
                onClick={() => onSetForm(activeForm === 'issue' ? null : 'issue')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  activeForm === 'issue'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'text-muted-foreground hover:bg-red-500/8 hover:text-red-600 dark:hover:text-red-400',
                )}
              >
                <Plus className="h-3 w-3" />
                Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ orgSlug }: { orgSlug: string }) {
  return (
    <Card
      className="items-center justify-center py-16 px-6 text-center"
      style={{ animation: 'dash-fade-in 0.4s ease-out 0.2s both' }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Package className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-foreground mb-1.5">
        No active products
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Create your first product to start managing ideas, roadmaps, and issues.
      </p>
      <Button asChild>
        <Link
          to="/$orgSlug/products/new"
          params={{ orgSlug }}
        >
          <Plus className="h-4 w-4" />
          Create Product
        </Link>
      </Button>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────

function DashboardPage() {
  const { products, stats } = Route.useLoaderData()
  const { orgSlug } = Route.useParams()
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)

  const statData = [
    {
      value: stats.activeProducts,
      label: 'Products',
      sublabel: `${stats.totalProducts} total`,
    },
    {
      value: stats.totalIdeas,
      label: 'Ideas',
      sublabel: 'Across products',
    },
    {
      value: stats.activeFeatures,
      label: 'Active Features',
      sublabel: 'In progress & planned',
    },
    {
      value: stats.openIssues,
      label: 'Open Issues',
      sublabel: `${stats.totalIssues} total`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="page-heading">Dashboard</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your product management overview.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statData.map((stat, i) => (
          <StatPill
            key={statItems[i].key}
            icon={statItems[i].icon}
            iconBg={statItems[i].iconBg}
            iconColor={statItems[i].iconColor}
            value={stat.value}
            label={stat.label}
            sublabel={stat.sublabel}
            href={`/${orgSlug}/products`}
            index={i}
          />
        ))}
      </div>

      {/* Products section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-lg text-foreground">
            Your Products
          </h3>
          <Button variant="secondary" size="sm" asChild>
            <Link
              to="/$orgSlug/products/new"
              params={{ orgSlug }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Product
            </Link>
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                orgSlug={orgSlug}
                index={index}
                activeForm={
                  activeForm?.productId === product.id
                    ? activeForm.type
                    : null
                }
                onSetForm={(type) =>
                  setActiveForm(
                    type ? { productId: product.id, type } : null,
                  )
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState orgSlug={orgSlug} />
        )}
      </div>
    </div>
  )
}
