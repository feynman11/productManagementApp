import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Rocket,
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'
import { getProductReleases, getOrCreateProductRoadmap, createRelease } from '~/server/functions/roadmap'
import { canProductWrite } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/releases',
)({
  loader: ({ params }) =>
    Promise.all([
      getProductReleases({ data: { productId: params.productId } }),
      getOrCreateProductRoadmap({ data: { productId: params.productId } }),
    ]).then(([releases, roadmap]) => ({ releases, roadmapId: roadmap.id })),
  component: ReleasesPage,
})

// ──────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────

const featureStatusStyles: Record<string, { dot: string; text: string }> = {
  BACKLOG: { dot: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
  PLANNED: { dot: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400' },
  IN_PROGRESS: { dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
  COMPLETED: { dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' },
  CANCELLED: { dot: 'bg-gray-400', text: 'text-muted-foreground' },
}

const releaseStatusColor: Record<string, string> = {
  PLANNED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  RELEASED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-muted text-muted-foreground',
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatStatus(s: string) {
  return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
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
      setError(err instanceof Error ? err.message : 'Failed to create release')
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
// Component
// ──────────────────────────────────────────────────────

function ReleasesPage() {
  const { releases, roadmapId } = Route.useLoaderData()
  const router = useRouter()
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const userCanWrite = canProductWrite(productRole ?? null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (releases.length === 0 && !showAddForm) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 mb-3">
            <Rocket className="h-6 w-6 text-violet-500" />
          </div>
          <h3 className="font-heading font-semibold text-foreground mb-1">No releases yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Create your first release to group features together.
          </p>
          {userCanWrite && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Release
            </Button>
          )}
        </Card>
      </div>
    )
  }

  if (releases.length === 0 && showAddForm) {
    return (
      <div className="space-y-4">
        <AddReleasePanel
          roadmapId={roadmapId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            router.invalidate()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{releases.length}</span>
          {' '}release{releases.length !== 1 ? 's' : ''}
        </p>
        {userCanWrite && !showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Release
          </Button>
        )}
      </div>

      {showAddForm && (
        <AddReleasePanel
          roadmapId={roadmapId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            router.invalidate()
          }}
        />
      )}

      <div className="space-y-3">
        {releases.map((release, i) => {
          const isExpanded = expandedIds.has(release.id)
          const featureCount = release._count.items
          return (
            <Card
              key={release.id}
              className="p-0 overflow-hidden transition-all duration-200 hover:border-primary/15"
              style={{ animation: `dash-fade-in 0.3s ease-out ${i * 0.04}s both` }}
            >
              {/* Release header -- clickable to expand */}
              <button
                onClick={() => toggleExpand(release.id)}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div className="shrink-0 text-muted-foreground">
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-semibold text-foreground font-heading truncate">
                      {release.name}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] shrink-0', releaseStatusColor[release.status] ?? 'bg-muted text-muted-foreground')}
                    >
                      {formatStatus(release.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="tabular-nums font-medium">
                      {featureCount} feature{featureCount !== 1 ? 's' : ''}
                    </span>
                    {release.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(release.targetDate)}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded feature list */}
              {isExpanded && (
                <div className="border-t border-border/40">
                  {release.description && (
                    <p className="px-4 pt-3 text-xs text-muted-foreground">
                      {release.description}
                    </p>
                  )}
                  {release.items.length > 0 ? (
                    <div className="p-3 space-y-1">
                      {release.items.map((item) => {
                        const st = featureStatusStyles[item.status] ?? featureStatusStyles.BACKLOG
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
                          >
                            <div className={cn('h-2 w-2 rounded-full shrink-0', st.dot)} />
                            <span className="text-sm text-foreground truncate flex-1">
                              {item.title}
                            </span>
                            <span className={cn('text-[10px] font-medium shrink-0', st.text)}>
                              {formatStatus(item.status)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground/60 italic">
                      No features assigned to this release
                    </p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
