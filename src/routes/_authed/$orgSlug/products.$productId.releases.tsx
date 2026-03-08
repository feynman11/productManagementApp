import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Rocket,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { getProductReleases } from '~/server/functions/roadmap'
import { cn } from '~/lib/utils'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/releases',
)({
  loader: ({ params }) => getProductReleases({ data: { productId: params.productId } }),
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
// Component
// ──────────────────────────────────────────────────────

function ReleasesPage() {
  const releases = Route.useLoaderData()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (releases.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 mb-3">
          <Rocket className="h-6 w-6 text-violet-500" />
        </div>
        <h3 className="font-heading font-semibold text-foreground mb-1">No releases yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create releases from the Roadmap view to group features together.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{releases.length}</span>
        {' '}release{releases.length !== 1 ? 's' : ''}
      </p>

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
