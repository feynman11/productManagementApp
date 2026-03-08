import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState, useMemo, useRef } from 'react'
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
  Package,
  Layers,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Calendar,
} from 'lucide-react'
import { getProduct, updateProduct, archiveProduct } from '~/server/functions/products'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite, canAdmin } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute('/_authed/$orgSlug/products/$productId')({
  loader: ({ params }) => getProduct({ data: { productId: params.productId } }),
  component: ProductDetailPage,
})

// ──────────────────────────────────────────────────────
// Timeline helpers
// ──────────────────────────────────────────────────────

type ProductData = Awaited<ReturnType<typeof getProduct>>
type TimelineRelease = ProductData['releases'][number]

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

const releaseStatusColor: Record<string, { marker: string; badge: string }> = {
  PLANNED: { marker: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  IN_PROGRESS: { marker: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  RELEASED: { marker: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  CANCELLED: { marker: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' },
}

function formatStatus(s: string) {
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

// ──────────────────────────────────────────────────────
// Release Timeline Component
// ──────────────────────────────────────────────────────

function ReleaseTimeline({
  releases,
  orgSlug,
  productId,
}: {
  releases: TimelineRelease[]
  orgSlug: string
  productId: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()

  // Build month range: 2 months before earliest release through 2 after latest, minimum 8 months centered on today
  const { months, todayIndex } = useMemo(() => {
    const today = new Date()
    let startYear = today.getFullYear()
    let startMonth = today.getMonth() - 2

    let endYear = today.getFullYear()
    let endMonth = today.getMonth() + 5

    // Extend range to cover all releases
    for (const r of releases) {
      if (!r.targetDate) continue
      const d = new Date(r.targetDate)
      const ry = d.getFullYear()
      const rm = d.getMonth()
      if (ry < startYear || (ry === startYear && rm - 1 < startMonth)) {
        startYear = ry
        startMonth = rm - 1
      }
      if (ry > endYear || (ry === endYear && rm + 1 > endMonth)) {
        endYear = ry
        endMonth = rm + 1
      }
    }

    // Normalize
    while (startMonth < 0) { startYear--; startMonth += 12 }
    while (endMonth > 11) { endYear++; endMonth -= 12 }

    const result: { year: number; month: number; key: string }[] = []
    let y = startYear, m = startMonth
    let tIdx = -1
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const key = monthKey(y, m)
      if (y === today.getFullYear() && m === today.getMonth()) tIdx = result.length
      result.push({ year: y, month: m, key })
      m++
      if (m > 11) { m = 0; y++ }
    }

    return { months: result, todayIndex: tIdx }
  }, [releases])

  // Group releases by month
  const releasesByMonth = useMemo(() => {
    const map: Record<string, TimelineRelease[]> = {}
    for (const r of releases) {
      if (!r.targetDate) continue
      const d = new Date(r.targetDate)
      const key = monthKey(d.getFullYear(), d.getMonth())
      if (!map[key]) map[key] = []
      map[key].push(r)
    }
    return map
  }, [releases])

  // Releases without a target date
  const undatedReleases = releases.filter(r => !r.targetDate)

  const CELL_W = 128

  function scrollBy(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * CELL_W * 3, behavior: 'smooth' })
  }

  function scrollToToday() {
    if (todayIndex >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ left: Math.max(0, todayIndex * CELL_W - CELL_W), behavior: 'smooth' })
    }
  }

  // Auto-scroll to today on mount
  useMemo(() => {
    setTimeout(() => scrollToToday(), 50)
  }, [])

  if (releases.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Rocket className="h-4 w-4 text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground font-heading">
              Release Timeline
            </h3>
          </div>
          <p className="text-xs text-muted-foreground/60 italic">
            No releases planned yet. Create releases from the Roadmap view.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0 gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <Rocket className="h-4 w-4 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground font-heading">
            Release Timeline
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {releases.length} release{releases.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => scrollBy(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="xs" onClick={scrollToToday} className="px-2 text-[10px] font-semibold uppercase tracking-wider">
            Today
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => scrollBy(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline grid */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-thin"
      >
        <div style={{ minWidth: months.length * CELL_W }} className="relative">
          {/* Month header row */}
          <div className="flex border-b border-border/30">
            {months.map((m, i) => {
              const isCurrent = i === todayIndex
              const isNewYear = m.month === 0 || i === 0
              return (
                <div
                  key={m.key}
                  className={cn(
                    'shrink-0 border-r border-border/20 px-3 py-2',
                    isCurrent && 'bg-primary/5',
                  )}
                  style={{ width: CELL_W }}
                >
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      'text-xs font-semibold',
                      isCurrent ? 'text-primary' : 'text-foreground',
                    )}>
                      {MONTH_NAMES[m.month]}
                    </span>
                    {isNewYear && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {m.year}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Release markers row */}
          <div className="flex relative" style={{ minHeight: 80 }}>
            {/* Today indicator line */}
            {todayIndex >= 0 && (() => {
              const dayFraction = now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              const leftPx = todayIndex * CELL_W + dayFraction * CELL_W
              return (
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                  style={{ left: leftPx }}
                >
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                </div>
              )
            })()}

            {/* Grid columns background */}
            {months.map((m, i) => (
              <div
                key={m.key}
                className={cn(
                  'shrink-0 border-r border-border/10',
                  i === todayIndex && 'bg-primary/3',
                )}
                style={{ width: CELL_W }}
              />
            ))}

            {/* Release markers positioned absolutely */}
            {months.map((m) => {
              const monthReleases = releasesByMonth[m.key]
              if (!monthReleases) return null
              const mIdx = months.findIndex(mo => mo.key === m.key)
              return monthReleases.map((release: TimelineRelease, ri: number) => {
                const d = new Date(release.targetDate!)
                const dayFraction = d.getDate() / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
                const leftPx = mIdx * CELL_W + dayFraction * CELL_W
                const colors = releaseStatusColor[release.status] ?? releaseStatusColor.PLANNED

                return (
                  <div
                    key={release.id}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: leftPx,
                      top: 8 + ri * 56,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Diamond marker */}
                    <Diamond className={cn('h-4 w-4 fill-current', colors.marker)} />

                    {/* Release card */}
                    <div className={cn(
                      'mt-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 whitespace-nowrap',
                      'shadow-sm transition-shadow hover:shadow-md',
                    )}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-foreground truncate max-w-[100px]">
                          {release.name}
                        </span>
                        <span className={cn('badge text-[9px] py-0 px-1.5', colors.badge)}>
                          {release._count.items}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatStatus(release.status)}
                      </div>
                    </div>
                  </div>
                )
              })
            })}
          </div>
        </div>
      </div>

      {/* Undated releases */}
      {undatedReleases.length > 0 && (
        <div className="border-t border-border/40 px-5 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Unscheduled
          </p>
          <div className="flex flex-wrap gap-2">
            {undatedReleases.map((r) => {
              const colors = releaseStatusColor[r.status] ?? releaseStatusColor.PLANNED
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5"
                >
                  <Diamond className={cn('h-3 w-3 fill-current', colors.marker)} />
                  <span className="text-xs font-medium text-foreground">{r.name}</span>
                  <span className={cn('badge text-[9px] py-0 px-1.5', colors.badge)}>
                    {r._count.items}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────

function ProductDetailPage() {
  const product = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
  const navigate = useNavigate()

  const userCanWrite = canWrite(role as any, isDemo)
  const userCanAdmin = canAdmin(role as any, isDemo)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState(product.name)
  const [editDescription, setEditDescription] = useState(
    product.description ?? '',
  )
  const [editVision, setEditVision] = useState(product.vision ?? '')
  const [editStrategy, setEditStrategy] = useState(product.strategy ?? '')

  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isIdeasTab = currentPath.includes('/ideas')
  const isFeaturesTab = currentPath.includes('/features')
  const isRoadmapTab = currentPath.includes('/roadmap')
  const isIssuesTab = currentPath.includes('/issues')
  const isReleasesTab = currentPath.includes('/releases')
  const isOverview = !isIdeasTab && !isFeaturesTab && !isRoadmapTab && !isIssuesTab && !isReleasesTab

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
      label: 'Features',
      href: `/${orgSlug}/products/${productId}/features`,
      isActive: isFeaturesTab,
      icon: Layers,
    },
    {
      label: 'Issues',
      href: `/${orgSlug}/products/${productId}/issues`,
      isActive: isIssuesTab,
      icon: AlertCircle,
    },
    {
      label: 'Releases',
      href: `/${orgSlug}/products/${productId}/releases`,
      isActive: isReleasesTab,
      icon: Rocket,
    },
    {
      label: 'Roadmap',
      href: `/${orgSlug}/products/${productId}/roadmap`,
      isActive: isRoadmapTab,
      icon: Map,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() =>
              navigate({ to: '/$orgSlug/products', params: { orgSlug } })
            }
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${product.color}15` }}
              >
                <Package className="h-4 w-4" style={{ color: product.color }} />
              </div>
              <div>
                <h2 className="page-heading">{product.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={product.status} />
                </div>
              </div>
            </div>
            {product.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-lg">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {userCanWrite && !editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {userCanAdmin && product.status !== 'ARCHIVED' && (
            <Button variant="destructive" size="sm" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border/60">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.label}
                to={tab.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-t-lg px-4 pb-3 pt-2 text-sm font-medium transition-all duration-150 whitespace-nowrap',
                  tab.isActive
                    ? 'border-b-2 border-primary text-foreground bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <Icon className={cn('h-4 w-4', tab.isActive && 'text-primary')} />
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">
                    Edit Product
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      onClick={handleSaveEdit}
                      disabled={saving || !editName.trim()}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setEditing(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm resize-none dark:bg-input/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Vision</label>
                  <textarea
                    value={editVision}
                    onChange={(e) => setEditVision(e.target.value)}
                    rows={3}
                    className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm resize-none dark:bg-input/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Strategy</label>
                  <textarea
                    value={editStrategy}
                    onChange={(e) => setEditStrategy(e.target.value)}
                    rows={3}
                    className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm resize-none dark:bg-input/30"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Vision & Strategy */}
              {(product.vision || product.strategy) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {product.vision && (
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Vision
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {product.vision}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {product.strategy && (
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Strategy
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {product.strategy}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Release Timeline */}
              <ReleaseTimeline
                releases={product.releases}
                orgSlug={orgSlug}
                productId={productId}
              />

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Ideas', count: product._count.ideas, icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10', link: `/${orgSlug}/products/${productId}/ideas` },
                  { label: 'Features', count: product.activeFeatureCount, icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: `/${orgSlug}/products/${productId}/features` },
                  { label: 'Issues', count: product._count.issues, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', link: `/${orgSlug}/products/${productId}/issues` },
                  { label: 'Members', count: product._count.members, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat) => {
                  const StatIcon = stat.icon
                  const isClickable = !!stat.link
                  const content = (
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}>
                          <StatIcon className={cn('h-4.5 w-4.5', stat.color)} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground font-heading tabular-nums">
                            {stat.count}
                          </p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  )

                  if (stat.link) {
                    return (
                      <Link key={stat.label} to={stat.link}>
                        <Card className="cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md py-0">
                          {content}
                        </Card>
                      </Link>
                    )
                  }

                  return (
                    <Card key={stat.label} className="py-0">
                      {content}
                    </Card>
                  )
                })}
              </div>

              {/* Members */}
              {product.members && product.members.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground font-heading">
                        Team Members
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {product.members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {(member.userId || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground font-mono text-xs">
                              {(member.userId || '').slice(0, 12)}...
                            </span>
                          </div>
                          <span
                            className={cn(
                              'badge',
                              member.role === 'LEAD'
                                ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goals */}
              {product.goals && product.goals.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Target className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground font-heading">
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
                            className="rounded-lg bg-muted/40 p-4"
                          >
                            <div className="mb-1.5 flex items-center justify-between">
                              <h4 className="text-sm font-medium text-foreground">
                                {goal.title}
                              </h4>
                              {progress != null && (
                                <span className="text-xs font-semibold text-primary tabular-nums">
                                  {progress}%
                                </span>
                              )}
                            </div>
                            {goal.description && (
                              <p className="mb-2.5 text-xs text-muted-foreground">
                                {goal.description}
                              </p>
                            )}
                            {progress != null && (
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
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
