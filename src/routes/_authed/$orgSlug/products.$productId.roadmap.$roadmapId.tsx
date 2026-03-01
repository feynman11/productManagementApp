import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Clock,
  Plus,
  Package2,
  X,
  ChevronRight,
  Calendar,
  Flag,
} from 'lucide-react'
import {
  getRoadmap,
  createRoadmapItem,
  moveRoadmapItem,
  createRelease,
} from '~/server/functions/roadmap'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite, canAdmin } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/roadmap/$roadmapId',
)({
  loader: ({ params }) =>
    getRoadmap({ data: { roadmapId: params.roadmapId } }),
  component: RoadmapDetailPage,
})

type ViewMode = 'kanban' | 'list' | 'timeline'

const KANBAN_COLUMNS = [
  { status: 'BACKLOG', label: 'Backlog' },
  { status: 'PLANNED', label: 'Planned' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
] as const

const PRIORITY_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function RoadmapDetailPage() {
  const roadmap = Route.useLoaderData()
  const { orgSlug, productId, roadmapId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)
  const userCanAdmin = canAdmin(parentData.clientUserRole as any)

  const [view, setView] = useState<ViewMode>('kanban')

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false)
  const [addItemColumn, setAddItemColumn] = useState<string>('BACKLOG')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemPriority, setNewItemPriority] = useState(0)
  const [addingItem, setAddingItem] = useState(false)

  // Add release state
  const [showAddRelease, setShowAddRelease] = useState(false)
  const [newReleaseName, setNewReleaseName] = useState('')
  const [newReleaseDescription, setNewReleaseDescription] = useState('')
  const [newReleaseDate, setNewReleaseDate] = useState('')
  const [addingRelease, setAddingRelease] = useState(false)

  function refreshPage() {
    navigate({
      to: '/$orgSlug/products/$productId/roadmap/$roadmapId',
      params: { orgSlug, productId, roadmapId },
    })
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    setAddingItem(true)
    try {
      await createRoadmapItem({
        data: {
          roadmapId,
          title: newItemTitle,
          description: newItemDescription || undefined,
          priority: newItemPriority,
        },
      })
      setShowAddItem(false)
      setNewItemTitle('')
      setNewItemDescription('')
      setNewItemPriority(0)
      refreshPage()
    } finally {
      setAddingItem(false)
    }
  }

  async function handleMoveItem(itemId: string, newStatus: string) {
    await moveRoadmapItem({
      data: { itemId, status: newStatus as any },
    })
    refreshPage()
  }

  async function handleAddRelease(e: React.FormEvent) {
    e.preventDefault()
    setAddingRelease(true)
    try {
      await createRelease({
        data: {
          roadmapId,
          name: newReleaseName,
          description: newReleaseDescription || undefined,
          targetDate: newReleaseDate ? new Date(newReleaseDate) : undefined,
        },
      })
      setShowAddRelease(false)
      setNewReleaseName('')
      setNewReleaseDescription('')
      setNewReleaseDate('')
      refreshPage()
    } finally {
      setAddingRelease(false)
    }
  }

  function openAddItem(columnStatus: string) {
    setAddItemColumn(columnStatus)
    setShowAddItem(true)
  }

  const items = roadmap.items ?? []
  const releases = roadmap.releases ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              navigate({
                to: '/$orgSlug/products/$productId/roadmap',
                params: { orgSlug, productId },
              })
            }
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Back to roadmaps"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {roadmap.name}
            </h3>
            {roadmap.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {roadmap.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-md border border-input bg-background">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 rounded-l-md px-3 text-xs font-medium transition-colors',
                view === 'kanban'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 border-x border-input px-3 text-xs font-medium transition-colors',
                view === 'list'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setView('timeline')}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 rounded-r-md px-3 text-xs font-medium transition-colors',
                view === 'timeline'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </button>
          </div>

          {userCanAdmin && (
            <button
              onClick={() => setShowAddRelease(true)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Package2 className="h-3.5 w-3.5" />
              New Release
            </button>
          )}
        </div>
      </div>

      {/* Add item modal */}
      {showAddItem && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-card-foreground">
              Add Item
            </h4>
            <button
              onClick={() => setShowAddItem(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAddItem} className="space-y-3">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Item title"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(Number(e.target.value))}
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>No Priority</option>
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingItem || !newItemTitle.trim()}
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {addingItem ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add release modal */}
      {showAddRelease && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-card-foreground">
              New Release
            </h4>
            <button
              onClick={() => setShowAddRelease(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAddRelease} className="space-y-3">
            <input
              type="text"
              value={newReleaseName}
              onChange={(e) => setNewReleaseName(e.target.value)}
              required
              maxLength={100}
              placeholder="Release name (e.g., v2.1.0)"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <textarea
              value={newReleaseDescription}
              onChange={(e) => setNewReleaseDescription(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Target Date
              </label>
              <input
                type="date"
                value={newReleaseDate}
                onChange={(e) => setNewReleaseDate(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRelease(false)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingRelease || !newReleaseName.trim()}
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {addingRelease ? 'Creating...' : 'Create Release'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Views */}
      {view === 'kanban' && (
        <KanbanView
          items={items}
          releases={releases}
          canWrite={userCanWrite}
          onAddItem={openAddItem}
          onMoveItem={handleMoveItem}
        />
      )}
      {view === 'list' && (
        <ListView items={items} releases={releases} />
      )}
      {view === 'timeline' && (
        <TimelineView items={items} />
      )}

      {/* Releases panel */}
      {releases.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">
              Releases
            </h3>
          </div>
          <div className="space-y-3">
            {releases.map((release: any) => {
              const releaseItems = items.filter(
                (item: any) => item.releaseId === release.id,
              )
              const completedCount = releaseItems.filter(
                (item: any) => item.status === 'COMPLETED',
              ).length
              const progress =
                releaseItems.length > 0
                  ? Math.round((completedCount / releaseItems.length) * 100)
                  : 0

              return (
                <div
                  key={release.id}
                  className="rounded-md border border-border p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {release.name}
                      </h4>
                      <StatusBadge status={release.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {release.targetDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(release.targetDate)}
                        </span>
                      )}
                      <span>
                        {release._count.items} items
                      </span>
                    </div>
                  </div>
                  {release.description && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      {release.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Kanban View
// ──────────────────────────────────────────────────────

interface KanbanViewProps {
  items: any[]
  releases: any[]
  canWrite: boolean
  onAddItem: (column: string) => void
  onMoveItem: (itemId: string, newStatus: string) => void
}

function KanbanView({
  items,
  releases,
  canWrite,
  onAddItem,
  onMoveItem,
}: KanbanViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnItems = items.filter(
          (item: any) => item.status === column.status,
        )

        return (
          <div
            key={column.status}
            className="rounded-lg border border-border bg-muted/30"
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {column.label}
                </h4>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                  {columnItems.length}
                </span>
              </div>
              {canWrite && (
                <button
                  onClick={() => onAddItem(column.status)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={`Add item to ${column.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Column items */}
            <div className="space-y-2 p-3">
              {columnItems.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No items
                </p>
              ) : (
                columnItems.map((item: any) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    currentStatus={column.status}
                    onMove={onMoveItem}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface KanbanCardProps {
  item: any
  currentStatus: string
  onMove: (itemId: string, newStatus: string) => void
}

function KanbanCard({ item, currentStatus, onMove }: KanbanCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  const priorityColor =
    item.priority >= 4
      ? 'bg-red-500'
      : item.priority >= 3
        ? 'bg-orange-500'
        : item.priority >= 2
          ? 'bg-yellow-500'
          : item.priority >= 1
            ? 'bg-green-500'
            : 'bg-transparent'

  const moveTargets = KANBAN_COLUMNS.filter(
    (col) => col.status !== currentStatus,
  )

  return (
    <div className="rounded-md border border-border bg-card p-3 transition-shadow hover:shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h5 className="text-sm font-medium text-card-foreground leading-tight">
          {item.title}
        </h5>
        {item.priority > 0 && (
          <div className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', priorityColor)} />
        )}
      </div>

      {item.description && (
        <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.release && (
            <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              <Package2 className="h-2.5 w-2.5" />
              {item.release.name}
            </span>
          )}
          {item.priority > 0 && (
            <span className="text-[10px]">
              P{item.priority}
            </span>
          )}
        </div>

        {/* Move menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Move item"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
          {showMoveMenu && (
            <div className="absolute right-0 top-6 z-10 w-32 rounded-md border border-border bg-popover p-1 shadow-md">
              {moveTargets.map((target) => (
                <button
                  key={target.status}
                  onClick={() => {
                    onMove(item.id, target.status)
                    setShowMoveMenu(false)
                  }}
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-xs text-popover-foreground hover:bg-accent"
                >
                  {target.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────
// List View
// ──────────────────────────────────────────────────────

interface ListViewProps {
  items: any[]
  releases: any[]
}

function ListView({ items, releases }: ListViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <List className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No items in this roadmap
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
              Priority
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
              Release
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
              Start Date
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
              End Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item: any) => (
            <tr
              key={item.id}
              className="bg-card transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3 text-sm font-medium text-foreground">
                {item.title}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                {PRIORITY_LABELS[item.priority] ?? `P${item.priority}`}
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                {item.release?.name ?? '--'}
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                {formatDate(item.startDate)}
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                {formatDate(item.endDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Timeline View (simplified horizontal bar chart)
// ──────────────────────────────────────────────────────

interface TimelineViewProps {
  items: any[]
}

function TimelineView({ items }: TimelineViewProps) {
  // Filter items that have dates
  const itemsWithDates = items.filter(
    (item: any) => item.startDate || item.endDate,
  )

  if (itemsWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <Clock className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No items with dates to display on timeline
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add start and end dates to roadmap items to see them here
        </p>
      </div>
    )
  }

  // Calculate the timeline bounds
  const allDates = itemsWithDates.flatMap((item: any) => {
    const dates: number[] = []
    if (item.startDate) dates.push(new Date(item.startDate).getTime())
    if (item.endDate) dates.push(new Date(item.endDate).getTime())
    return dates
  })

  const minDate = Math.min(...allDates)
  const maxDate = Math.max(...allDates)
  const range = maxDate - minDate || 1

  const STATUS_COLORS: Record<string, string> = {
    BACKLOG: 'bg-blue-500/60',
    PLANNED: 'bg-blue-500',
    IN_PROGRESS: 'bg-amber-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
  }

  return (
    <div className="space-y-3">
      {/* Timeline header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>{formatDate(new Date(minDate))}</span>
        <span>{formatDate(new Date(maxDate))}</span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {itemsWithDates.map((item: any) => {
          const start = item.startDate
            ? new Date(item.startDate).getTime()
            : minDate
          const end = item.endDate
            ? new Date(item.endDate).getTime()
            : maxDate

          const leftPct = ((start - minDate) / range) * 100
          const widthPct = Math.max(2, ((end - start) / range) * 100)

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-32 shrink-0 truncate text-xs font-medium text-foreground">
                {item.title}
              </div>
              <div className="relative h-6 flex-1 rounded bg-muted">
                <div
                  className={cn(
                    'absolute top-0 h-6 rounded transition-all',
                    STATUS_COLORS[item.status] ?? 'bg-gray-400',
                  )}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white truncate px-1">
                    {item.title}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
