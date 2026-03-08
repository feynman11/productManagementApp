import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  Package2,
  Crosshair,
} from 'lucide-react'
import {
  getOrCreateProductRoadmap,
  createRoadmapItem,
  createRelease,
  updateRoadmapItem,
} from '~/server/functions/roadmap'
import { canWrite, canAdmin } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'

// ──────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/roadmap/',
)({
  loader: ({ params }) =>
    getOrCreateProductRoadmap({ data: { productId: params.productId } }),
  component: RoadmapPage,
})

// ──────────────────────────────────────────────────────
// Constants & Config
// ──────────────────────────────────────────────────────

const MONTH_W = 148
const MONTHS_VISIBLE = 8
const ROW_H = 44
const BAR_H = 28
const BAR_Y = 8
const LABEL_W = 180

const STATUS_BAR: Record<string, string> = {
  BACKLOG: 'bg-blue-400/70 dark:bg-blue-500/50',
  PLANNED: 'bg-indigo-500/75 dark:bg-indigo-400/65',
  IN_PROGRESS: 'bg-amber-500/85 dark:bg-amber-400/75',
  COMPLETED: 'bg-emerald-500/80 dark:bg-emerald-400/70',
  CANCELLED: 'bg-gray-400/50 dark:bg-gray-500/40',
}

const STATUS_BADGE: Record<string, string> = {
  BACKLOG: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PLANNED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-gray-500/10 text-gray-500',
}

const RELEASE_BADGE: Record<string, string> = {
  PLANNED:
    'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400',
  IN_PROGRESS:
    'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  RELEASED:
    'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'border-border bg-muted/50 text-muted-foreground',
}

const PRIORITY_DOT: Record<number, string> = {
  4: 'bg-red-500',
  3: 'bg-orange-500',
  2: 'bg-amber-400',
  1: 'bg-emerald-500',
}

// ──────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────

function mStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addM(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function sameM(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
function daysIn(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}
function fmtMo(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short' })
}
function fmtMoYr(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
function fmtStatus(s: string) {
  return s
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

/** Fractional month offset from ref month-start to target date */
function mOff(ref: Date, target: Date) {
  const yd = target.getFullYear() - ref.getFullYear()
  const md = target.getMonth() - ref.getMonth()
  const dd =
    (target.getDate() - 1) /
    daysIn(target.getFullYear(), target.getMonth())
  return yd * 12 + md + dd
}

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

type Roadmap = Awaited<ReturnType<typeof getOrCreateProductRoadmap>>
type Item = Roadmap['items'][number]
type Rel = Roadmap['releases'][number]

// ──────────────────────────────────────────────────────
// Add Feature Panel
// ──────────────────────────────────────────────────────

function AddFeaturePanel({
  roadmapId,
  releases,
  onClose,
  onSuccess,
}: {
  roadmapId: string
  releases: Rel[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [releaseId, setReleaseId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createRoadmapItem({
        data: {
          roadmapId,
          title,
          description: description || undefined,
          priority: Number(priority),
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          releaseId: releaseId || undefined,
        },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add feature')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      className="p-0"
      style={{ animation: 'dash-fade-in 0.25s ease-out both' }}
    >
      <CardHeader className="flex-row items-center justify-between px-5 py-4">
        <CardTitle className="text-sm font-heading">Add Feature</CardTitle>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Feature name"
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What does this feature do?"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="4">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Release
              </label>
              <Select value={releaseId} onValueChange={setReleaseId}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="No release" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No release</SelectItem>
                  {releases.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Adding...' : 'Add Feature'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Add Release Panel
// ──────────────────────────────────────────────────────

function AddReleasePanel({
  roadmapId,
  onClose,
  onSuccess,
}: {
  roadmapId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createRelease({
        data: {
          roadmapId,
          name,
          description: description || undefined,
          targetDate: targetDate ? new Date(targetDate) : undefined,
        },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create release',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      className="p-0"
      style={{ animation: 'dash-fade-in 0.25s ease-out both' }}
    >
      <CardHeader className="flex-row items-center justify-between px-5 py-4">
        <CardTitle className="text-sm font-heading">New Release</CardTitle>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g., v2.1.0"
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Target Date
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What's in this release?"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating...' : 'Create Release'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Unscheduled Feature Card
// ──────────────────────────────────────────────────────

function UnscheduledCard({
  item,
  releases,
  userCanWrite,
  onRefresh,
}: {
  item: Item
  releases: Rel[]
  userCanWrite: boolean
  onRefresh: () => void
}) {
  const [scheduling, setScheduling] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [releaseId, setReleaseId] = useState(item.releaseId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate) return
    setSaving(true)
    try {
      await updateRoadmapItem({
        data: {
          itemId: item.id,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          releaseId: releaseId || undefined,
        },
      })
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignRelease(newId: string) {
    await updateRoadmapItem({
      data: { itemId: item.id, releaseId: newId || undefined },
    })
    onRefresh()
  }

  return (
    <Card className="p-0">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">
              {item.title}
            </h4>
            {item.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            )}
          </div>
          {item.priority > 0 && (
            <div
              className={cn(
                'h-2.5 w-2.5 shrink-0 rounded-full mt-1',
                PRIORITY_DOT[item.priority],
              )}
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={cn('text-[10px]', STATUS_BADGE[item.status])}>
            {fmtStatus(item.status)}
          </Badge>
          {item.release && (
            <Badge variant="secondary" className="text-[10px]">
              {item.release.name}
            </Badge>
          )}
        </div>

        {userCanWrite && (
          <>
            {!scheduling ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setScheduling(true)}
                  className="text-primary hover:bg-primary/8"
                >
                  <Calendar className="h-3 w-3" />
                  Schedule
                </Button>
                {releases.length > 0 && !item.releaseId && (
                  <Select value="" onValueChange={handleAssignRelease}>
                    <SelectTrigger size="sm" className="h-7 text-[10px] font-medium text-muted-foreground">
                      <SelectValue placeholder="Assign release" />
                    </SelectTrigger>
                    <SelectContent>
                      {releases.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSchedule}
                className="space-y-2 rounded-lg bg-muted/30 p-2.5"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">
                      Start
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="h-7 text-[11px]"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">
                      End
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-7 text-[11px]"
                    />
                  </div>
                </div>
                {releases.length > 0 && (
                  <Select value={releaseId} onValueChange={setReleaseId}>
                    <SelectTrigger className="h-7 w-full text-[11px]">
                      <SelectValue placeholder="No release" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No release</SelectItem>
                      {releases.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setScheduling(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={saving || !startDate}
                  >
                    {saving ? '...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────

function RoadmapPage() {
  const roadmap = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const router = useRouter()
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }

  const userCanWrite = canWrite(role as any, isDemo)
  const userCanAdmin = canAdmin(role as any, isDemo)

  const now = new Date()
  const [viewStart, setViewStart] = useState(() => addM(mStart(now), -1))
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [showAddRelease, setShowAddRelease] = useState(false)

  const items = roadmap.items ?? []
  const releases = roadmap.releases ?? []
  const roadmapId = roadmap.id

  const scheduled = items.filter((i: Item) => i.startDate)
  const unscheduled = items.filter(
    (i: Item) => !i.startDate && !i.endDate,
  )

  const months = useMemo(
    () => Array.from({ length: MONTHS_VISIBLE }, (_, i) => addM(viewStart, i)),
    [viewStart],
  )

  function refresh() {
    router.invalidate()
  }

  // ── Today marker position ──
  const todayPos = mOff(viewStart, now)
  const showToday = todayPos >= 0 && todayPos <= MONTHS_VISIBLE

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="page-heading">Roadmap</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} feature{items.length !== 1 ? 's' : ''} ·{' '}
            {releases.length} release{releases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userCanWrite && (
            <Button
              onClick={() => {
                setShowAddFeature(true)
                setShowAddRelease(false)
              }}
              size="sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Feature
            </Button>
          )}
          {userCanAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddRelease(true)
                setShowAddFeature(false)
              }}
            >
              <Package2 className="h-3.5 w-3.5" />
              Release
            </Button>
          )}
        </div>
      </div>

      {/* Releases strip */}
      {releases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {releases.map((r: Rel) => (
            <div
              key={r.id}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium',
                RELEASE_BADGE[r.status] ?? RELEASE_BADGE.PLANNED,
              )}
            >
              <Flag className="h-3 w-3" />
              <span className="font-semibold">{r.name}</span>
              {r.targetDate && (
                <span className="opacity-70">{fmtDate(r.targetDate)}</span>
              )}
              <span className="opacity-50">
                {r._count.items} feature{r._count.items !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Feature form */}
      {showAddFeature && (
        <AddFeaturePanel
          roadmapId={roadmapId}
          releases={releases}
          onClose={() => setShowAddFeature(false)}
          onSuccess={() => {
            setShowAddFeature(false)
            refresh()
          }}
        />
      )}

      {/* Add Release form */}
      {showAddRelease && (
        <AddReleasePanel
          roadmapId={roadmapId}
          onClose={() => setShowAddRelease(false)}
          onSuccess={() => {
            setShowAddRelease(false)
            refresh()
          }}
        />
      )}

      {/* ── Timeline ────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        {/* Nav bar */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewStart((v) => addM(v, -3))}
              aria-label="Previous months"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStart(addM(mStart(now), -1))}
            >
              <Crosshair className="h-3 w-3" />
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewStart((v) => addM(v, 3))}
              aria-label="Next months"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {fmtMoYr(months[0])} — {fmtMoYr(months[months.length - 1])}
          </span>
        </div>

        {/* Timeline grid */}
        <div className="overflow-x-auto">
          <div
            style={{ minWidth: LABEL_W + MONTHS_VISIBLE * MONTH_W }}
          >
            {/* Month header row */}
            <div className="flex border-b border-border/40">
              <div
                className="shrink-0 border-r border-border/40 px-3 py-2.5"
                style={{ width: LABEL_W }}
              >
                <span className="section-title">Feature</span>
              </div>
              {months.map((m) => (
                <div
                  key={m.toISOString()}
                  className={cn(
                    'shrink-0 border-r border-border/20 px-2 py-2.5 text-center text-xs font-semibold',
                    sameM(m, now)
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground',
                  )}
                  style={{ width: MONTH_W }}
                >
                  {m.getMonth() === 0 ? fmtMoYr(m) : fmtMo(m)}
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {scheduled.length > 0 ? (
              <div className="relative">
                {/* Background grid + current-month highlight */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ left: LABEL_W }}
                >
                  {months.map((m, i) => (
                    <div
                      key={m.toISOString()}
                      className={cn(
                        'absolute top-0 bottom-0 border-r',
                        sameM(m, now)
                          ? 'border-primary/10 bg-primary/[0.02]'
                          : 'border-border/10',
                      )}
                      style={{ left: i * MONTH_W, width: MONTH_W }}
                    />
                  ))}
                </div>

                {/* Today vertical line */}
                {showToday && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-20"
                    style={{ left: LABEL_W + todayPos * MONTH_W }}
                  >
                    <div className="h-full w-0.5 bg-primary/50" />
                    <div className="absolute top-0 -translate-x-1/2 rounded-b-md bg-primary px-1.5 py-px text-[8px] font-bold text-primary-foreground tracking-wide uppercase">
                      Today
                    </div>
                  </div>
                )}

                {/* Release markers (dashed vertical lines) */}
                {releases
                  .filter((r: Rel) => r.targetDate)
                  .map((r: Rel) => {
                    const pos = mOff(viewStart, new Date(r.targetDate!))
                    if (pos < -0.5 || pos > MONTHS_VISIBLE + 0.5) return null
                    return (
                      <div
                        key={`rm-${r.id}`}
                        className="pointer-events-none absolute top-0 bottom-0 z-10"
                        style={{ left: LABEL_W + pos * MONTH_W }}
                      >
                        <div className="h-full border-l-2 border-dashed border-indigo-400/30 dark:border-indigo-300/20" />
                        <div className="absolute top-1 -translate-x-1/2 flex flex-col items-center gap-0.5">
                          <Flag className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                          <span className="rounded bg-indigo-500/10 px-1 text-[8px] font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {r.name}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                {/* Feature rows */}
                {scheduled.map((item: Item, idx: number) => {
                  const start = new Date(item.startDate!)
                  const end = item.endDate
                    ? new Date(item.endDate)
                    : addM(start, 1)

                  const sPos = mOff(viewStart, start)
                  const ePos = mOff(viewStart, end)

                  const leftPx = Math.max(sPos * MONTH_W, 0)
                  const rightPx = Math.min(
                    ePos * MONTH_W,
                    MONTHS_VISIBLE * MONTH_W,
                  )
                  const widthPx = Math.max(rightPx - leftPx, 20)
                  const visible =
                    rightPx > 0 && leftPx < MONTHS_VISIBLE * MONTH_W

                  return (
                    <div
                      key={item.id}
                      className="group flex border-b border-border/[0.06]"
                      style={{ height: ROW_H }}
                    >
                      {/* Label column */}
                      <div
                        className="relative z-20 shrink-0 flex items-center gap-2 border-r border-border/40 bg-card px-3"
                        style={{ width: LABEL_W }}
                      >
                        {item.priority > 0 && (
                          <div
                            className={cn(
                              'h-2 w-2 shrink-0 rounded-full',
                              PRIORITY_DOT[item.priority],
                            )}
                          />
                        )}
                        <span className="text-xs font-medium text-foreground truncate flex-1">
                          {item.title}
                        </span>
                        {item.release && (
                          <Badge variant="secondary" className="text-[8px] py-0 px-1 shrink-0 hidden lg:inline-flex">
                            {item.release.name}
                          </Badge>
                        )}
                      </div>

                      {/* Bar area */}
                      <div
                        className="relative flex-1"
                        style={{
                          minWidth: MONTHS_VISIBLE * MONTH_W,
                        }}
                      >
                        {visible && (
                          <div
                            className={cn(
                              'absolute rounded-md shadow-sm border border-white/[0.12]',
                              'transition-shadow duration-150 hover:shadow-md',
                              STATUS_BAR[item.status] ?? STATUS_BAR.BACKLOG,
                            )}
                            style={{
                              left: leftPx,
                              width: widthPx,
                              top: BAR_Y,
                              height: BAR_H,
                              animation: `dash-fade-in 0.3s ease-out ${idx * 0.04}s both`,
                            }}
                            title={`${item.title} — ${fmtStatus(item.status)}`}
                          >
                            {widthPx > 60 && (
                              <span className="absolute inset-0 flex items-center px-2.5 text-[10px] font-semibold text-white truncate drop-shadow-sm">
                                {item.title}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Empty timeline state */
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold font-heading text-foreground">
                  No scheduled features
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs text-center">
                  Add features with start dates to see them on the timeline
                </p>
                {userCanWrite && (
                  <Button
                    onClick={() => setShowAddFeature(true)}
                    size="sm"
                    className="mt-5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add First Feature
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {scheduled.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 border-t border-border/30 px-4 py-2.5">
            {(
              [
                ['Backlog', 'bg-blue-400/70'],
                ['Planned', 'bg-indigo-500/75'],
                ['In Progress', 'bg-amber-500/85'],
                ['Completed', 'bg-emerald-500/80'],
              ] as const
            ).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn('h-2.5 w-6 rounded-sm', color)} />
                <span className="text-[10px] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-0 border-l-2 border-dashed border-indigo-400/40" />
              <Flag className="h-2.5 w-2.5 text-indigo-500" />
              <span className="text-[10px] text-muted-foreground">
                Release
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* ── Unscheduled section ─────────────────────────── */}
      {unscheduled.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Unscheduled
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {unscheduled.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((item: Item) => (
              <UnscheduledCard
                key={item.id}
                item={item}
                releases={releases}
                userCanWrite={userCanWrite}
                onRefresh={refresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
