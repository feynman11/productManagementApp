import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Layers,
  Rocket,
  Calendar,
  Eye,
  EyeOff,
  X,
  Check,
} from 'lucide-react'
import { getProductFeatures, getProductReleases, updateRoadmapItem, moveRoadmapItem } from '~/server/functions/roadmap'
import { canWrite } from '~/lib/permissions'
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

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/features',
)({
  loader: ({ params }) =>
    Promise.all([
      getProductFeatures({ data: { productId: params.productId } }),
      getProductReleases({ data: { productId: params.productId } }),
    ]).then(([features, releases]) => ({ features, releases })),
  component: FeaturesPage,
})

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

type Feature = Awaited<ReturnType<typeof getProductFeatures>>[number]
type Release = Awaited<ReturnType<typeof getProductReleases>>[number]

// ──────────────────────────────────────────────────────
// Status / priority config
// ──────────────────────────────────────────────────────

const STATUS_OPTIONS = ['BACKLOG', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

const featureStatusStyles: Record<string, { dot: string; text: string; bg: string }> = {
  BACKLOG: { dot: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  PLANNED: { dot: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  IN_PROGRESS: { dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  COMPLETED: { dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  CANCELLED: { dot: 'bg-gray-400', text: 'text-muted-foreground', bg: 'bg-muted' },
}

const PRIORITY_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' },
]

const priorityLabels: Record<number, { label: string; style: string }> = {
  4: { label: 'Urgent', style: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  3: { label: 'High', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  2: { label: 'Medium', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  1: { label: 'Low', style: 'bg-slate-500/10 text-muted-foreground' },
  0: { label: 'None', style: 'bg-muted text-muted-foreground' },
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toInputDate(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}

function formatStatus(s: string) {
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

// ──────────────────────────────────────────────────────
// Feature Detail Panel
// ──────────────────────────────────────────────────────

function FeatureDetailPanel({
  feature,
  releases,
  userCanWrite,
  onClose,
  onSaved,
}: {
  feature: Feature
  releases: Release[]
  userCanWrite: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(feature.title)
  const [description, setDescription] = useState(feature.description ?? '')
  const [priority, setPriority] = useState(String(feature.priority))
  const [status, setStatus] = useState(feature.status)
  const [startDate, setStartDate] = useState(toInputDate(feature.startDate))
  const [endDate, setEndDate] = useState(toInputDate(feature.endDate))
  const [releaseId, setReleaseId] = useState(feature.releaseId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasChanges =
    title !== feature.title ||
    description !== (feature.description ?? '') ||
    Number(priority) !== feature.priority ||
    status !== feature.status ||
    startDate !== toInputDate(feature.startDate) ||
    endDate !== toInputDate(feature.endDate) ||
    releaseId !== (feature.releaseId ?? '')

  // Non-BACKLOG features require release and dates within release range
  const needsScheduling = status !== 'BACKLOG'
  const missingRelease = needsScheduling && !releaseId
  const missingDates = needsScheduling && (!startDate || !endDate)

  // Check if dates fall within the selected release's target date
  const selectedRelease = releaseId ? releases.find(r => r.id === releaseId) : null
  const releaseTargetDate = selectedRelease?.targetDate ? toInputDate(selectedRelease.targetDate) : null
  const endDateExceedsRelease = releaseTargetDate && endDate && endDate > releaseTargetDate
  const startDateExceedsRelease = releaseTargetDate && startDate && startDate > releaseTargetDate
  const datesOutOfRange = !!(endDateExceedsRelease || startDateExceedsRelease)

  const hasValidationError = missingRelease || missingDates || datesOutOfRange

  async function handleSave() {
    setError('')
    if (hasValidationError) {
      if (datesOutOfRange) {
        setError('Feature dates must fall within the release target date')
        return
      }
      const missing: string[] = []
      if (missingRelease) missing.push('a release')
      if (!startDate) missing.push('a start date')
      if (!endDate) missing.push('an end date')
      setError(`Non-Backlog features require ${missing.join(', ')}`)
      return
    }
    setSaving(true)
    try {
      // Send all fields (including status) via updateRoadmapItem
      const updates: Record<string, unknown> = { itemId: feature.id }
      if (title !== feature.title) updates.title = title
      if (description !== (feature.description ?? '')) updates.description = description || undefined
      if (Number(priority) !== feature.priority) updates.priority = Number(priority)
      if (status !== feature.status) updates.status = status
      if (startDate !== toInputDate(feature.startDate)) updates.startDate = startDate || undefined
      if (endDate !== toInputDate(feature.endDate)) updates.endDate = endDate || undefined
      if (releaseId !== (feature.releaseId ?? '')) updates.releaseId = releaseId || undefined

      if (Object.keys(updates).length > 1) {
        await updateRoadmapItem({ data: updates as any })
      }

      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const statusStyle = featureStatusStyles[status] ?? featureStatusStyles.BACKLOG

  return (
    <Card className="p-0 overflow-hidden border-primary/20">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('h-2.5 w-2.5 rounded-full', statusStyle.dot)} />
          <CardTitle className="text-sm font-heading">Feature Details</CardTitle>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          {userCanWrite ? (
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="h-9 text-sm"
            />
          ) : (
            <p className="text-sm text-foreground">{title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          {userCanWrite ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the feature..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
            />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {description || <span className="text-muted-foreground/60 italic">No description</span>}
            </p>
          )}
        </div>

        {/* Status + Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            {userCanWrite ? (
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className={cn(statusStyle.bg, statusStyle.text)}>{formatStatus(status)}</Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            {userCanWrite ? (
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className={(priorityLabels[Number(priority)] ?? priorityLabels[0]).style}>
                {(priorityLabels[Number(priority)] ?? priorityLabels[0]).label}
              </Badge>
            )}
          </div>
        </div>

        {/* Release */}
        <div className="space-y-1.5">
          <label className={cn("text-xs font-medium", missingRelease ? "text-destructive" : "text-muted-foreground")}>
            Release{needsScheduling && ' *'}
          </label>
          {userCanWrite ? (
            <Select value={releaseId} onValueChange={setReleaseId}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="No release" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No release</SelectItem>
                {releases.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-foreground">
              {feature.release?.name ?? <span className="text-muted-foreground/60 italic">Unassigned</span>}
            </p>
          )}
        </div>

        {/* Dates row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={cn("text-xs font-medium", (needsScheduling && !startDate) || startDateExceedsRelease ? "text-destructive" : "text-muted-foreground")}>
              Start Date{needsScheduling && ' *'}
            </label>
            {userCanWrite ? (
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            ) : (
              <p className="text-sm text-foreground">{formatDate(feature.startDate) ?? <span className="text-muted-foreground/60 italic">Not set</span>}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={cn("text-xs font-medium", (needsScheduling && !endDate) || endDateExceedsRelease ? "text-destructive" : "text-muted-foreground")}>
              End Date{needsScheduling && ' *'}
            </label>
            {userCanWrite ? (
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            ) : (
              <p className="text-sm text-foreground">{formatDate(feature.endDate) ?? <span className="text-muted-foreground/60 italic">Not set</span>}</p>
            )}
          </div>
        </div>

        {/* Scheduling hint */}
        {needsScheduling && hasValidationError && (
          <p className="text-xs text-destructive">
            {datesOutOfRange
              ? `Feature dates must fall on or before the release target date${releaseTargetDate ? ` (${formatDate(releaseTargetDate)})` : ''}.`
              : 'Features must have a release, start date, and end date to be moved out of Backlog.'}
          </p>
        )}

        {/* Save / Cancel */}
        {userCanWrite && (
          <>
            <Separator />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasChanges || !title.trim()}
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────

function FeaturesPage() {
  const { features, releases } = Route.useLoaderData()
  const router = useRouter()
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
  const userCanWrite = canWrite(role as any, isDemo)

  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (showCompleted) return features
    return features.filter(f => f.status !== 'COMPLETED' && f.status !== 'CANCELLED')
  }, [features, showCompleted])

  const completedCount = features.filter(f => f.status === 'COMPLETED' || f.status === 'CANCELLED').length

  const selectedFeature = selectedId ? features.find(f => f.id === selectedId) ?? null : null

  function handleSaved() {
    setSelectedId(null)
    router.invalidate()
  }

  if (features.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 mb-3">
          <Layers className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="font-heading font-semibold text-foreground mb-1">No features yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add features from the Roadmap view or the dashboard.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>
          {' '}feature{filtered.length !== 1 ? 's' : ''}
          {!showCompleted && completedCount > 0 && (
            <span className="text-muted-foreground/60">
              {' '}({completedCount} hidden)
            </span>
          )}
        </p>
        {completedCount > 0 && (
          <Button
            variant={showCompleted ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={showCompleted ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}
          >
            {showCompleted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showCompleted ? 'Showing all' : 'Show completed'}
          </Button>
        )}
      </div>

      {/* Feature list */}
      <div className="space-y-2">
        {filtered.map((feature, i) => {
          const isSelected = feature.id === selectedId
          const statusStyle = featureStatusStyles[feature.status] ?? featureStatusStyles.BACKLOG
          const pri = priorityLabels[feature.priority] ?? priorityLabels[0]

          if (isSelected && selectedFeature) {
            return (
              <div
                key={feature.id}
                style={{ animation: `dash-fade-in 0.2s ease-out both` }}
              >
                <FeatureDetailPanel
                  feature={selectedFeature}
                  releases={releases}
                  userCanWrite={userCanWrite}
                  onClose={() => setSelectedId(null)}
                  onSaved={handleSaved}
                />
              </div>
            )
          }

          return (
            <Card
              key={feature.id}
              className="group p-0 cursor-pointer transition-all duration-200 hover:border-primary/20"
              onClick={() => setSelectedId(feature.id)}
              style={{ animation: `dash-fade-in 0.3s ease-out ${i * 0.03}s both` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={cn('h-2.5 w-2.5 rounded-full', statusStyle.dot)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                        {feature.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {feature.priority > 0 && (
                          <Badge variant="secondary" className={cn('text-[10px]', pri.style)}>{pri.label}</Badge>
                        )}
                        <span className={cn('text-[11px] font-medium', statusStyle.text)}>
                          {formatStatus(feature.status)}
                        </span>
                      </div>
                    </div>
                    {feature.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground/70">
                      {feature.release && (
                        <span className="flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          {feature.release.name}
                        </span>
                      )}
                      {(feature.startDate || feature.endDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(feature.startDate)}
                          {feature.startDate && feature.endDate && ' — '}
                          {formatDate(feature.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
