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
  FileDown,
} from 'lucide-react'
import {
  getRoadmap,
  createRoadmapItem,
  moveRoadmapItem,
  createRelease,
} from '~/server/functions/roadmap'
import { exportRoadmapPdf } from '~/server/functions/export-pdf'
import { downloadBase64 } from '~/lib/download'
import { StatusBadge } from '~/components/common/status-badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/roadmap/$roadmapId',
)({
  loader: ({ params }) =>
    getRoadmap({ data: { roadmapId: params.roadmapId } }),
  component: RoadmapDetailPage,
})

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
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
  const navigate = useNavigate()

  const userCanWrite = canWrite(role as any, isDemo)
  const userCanAdmin = canAdmin(role as any, isDemo)

  const [view, setView] = useState('kanban')

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false)
  const [addItemColumn, setAddItemColumn] = useState<string>('BACKLOG')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemPriority, setNewItemPriority] = useState('0')
  const [addingItem, setAddingItem] = useState(false)

  // Add release state
  const [showAddRelease, setShowAddRelease] = useState(false)
  const [newReleaseName, setNewReleaseName] = useState('')
  const [newReleaseDescription, setNewReleaseDescription] = useState('')
  const [newReleaseDate, setNewReleaseDate] = useState('')
  const [addingRelease, setAddingRelease] = useState(false)

  // PDF export state
  const [exporting, setExporting] = useState(false)

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
          priority: Number(newItemPriority),
        },
      })
      setShowAddItem(false)
      setNewItemTitle('')
      setNewItemDescription('')
      setNewItemPriority('0')
      refreshPage()
    } finally {
      setAddingItem(false)
    }
  }

  const [moveError, setMoveError] = useState('')

  async function handleMoveItem(itemId: string, newStatus: string) {
    setMoveError('')
    if (newStatus !== 'BACKLOG') {
      const item = items.find((i: any) => i.id === itemId)
      if (item) {
        const missing: string[] = []
        if (!item.releaseId) missing.push('a release')
        if (!item.startDate) missing.push('a start date')
        if (!item.endDate) missing.push('an end date')
        if (missing.length > 0) {
          setMoveError(`Cannot move "${item.title}" — requires ${missing.join(', ')}`)
          return
        }
      }
    }
    try {
      await moveRoadmapItem({
        data: { itemId, status: newStatus as any },
      })
      refreshPage()
    } catch (err: unknown) {
      setMoveError(err instanceof Error ? err.message : 'Failed to move item')
    }
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

  async function handleExportPdf() {
    setExporting(true)
    try {
      const result = await exportRoadmapPdf({ data: { roadmapId } })
      downloadBase64(result.base64, result.filename, 'application/pdf')
    } finally {
      setExporting(false)
    }
  }

  function openAddItem(columnStatus: string) {
    setAddItemColumn(columnStatus)
    setShowAddItem(true)
  }

  const items = roadmap.items ?? []
  const releases = roadmap.releases ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() =>
              navigate({
                to: '/$orgSlug/products/$productId/roadmap',
                params: { orgSlug, productId },
              })
            }
            aria-label="Back to roadmaps"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="page-heading text-xl">
              {roadmap.name}
            </h3>
            {roadmap.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {roadmap.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle using Tabs */}
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="kanban">
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-3.5 w-3.5" />
                List
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="h-3.5 w-3.5" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            <FileDown className="h-3.5 w-3.5" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>

          {userCanAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddRelease(true)}
            >
              <Package2 className="h-3.5 w-3.5" />
              New Release
            </Button>
          )}
        </div>
      </div>

      {/* Add item form */}
      {showAddItem && (
        <Card className="p-0">
          <CardHeader className="flex-row items-center justify-between px-6 py-4">
            <CardTitle className="text-sm font-heading">Add Item</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowAddItem(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <form onSubmit={handleAddItem} className="space-y-4">
              <Input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Item title"
              />
              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
              />
              <div className="flex items-center gap-3">
                <Select value={newItemPriority} onValueChange={setNewItemPriority}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Priority</SelectItem>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddItem(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingItem || !newItemTitle.trim()}
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add release form */}
      {showAddRelease && (
        <Card className="p-0">
          <CardHeader className="flex-row items-center justify-between px-6 py-4">
            <CardTitle className="text-sm font-heading">New Release</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowAddRelease(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <form onSubmit={handleAddRelease} className="space-y-4">
              <Input
                type="text"
                value={newReleaseName}
                onChange={(e) => setNewReleaseName(e.target.value)}
                required
                maxLength={100}
                placeholder="Release name (e.g., v2.1.0)"
              />
              <textarea
                value={newReleaseDescription}
                onChange={(e) => setNewReleaseDescription(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
              />
              <div className="space-y-1.5">
                <label className="section-title">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={newReleaseDate}
                  onChange={(e) => setNewReleaseDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddRelease(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingRelease || !newReleaseName.trim()}
                >
                  {addingRelease ? 'Creating...' : 'Create Release'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Move error */}
      {moveError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{moveError}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setMoveError('')}>
            <X className="h-3.5 w-3.5" />
          </Button>
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
        <Card className="p-0">
          <CardHeader className="px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="brand-tint flex h-8 w-8 items-center justify-center rounded-lg">
                <Package2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-heading">Releases</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-3">
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
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold font-heading text-foreground">
                        {release.name}
                      </h4>
                      <StatusBadge status={release.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {release.targetDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(release.targetDate)}
                        </span>
                      )}
                      <Badge variant="secondary">
                        {release._count.items} items
                      </Badge>
                    </div>
                  </div>
                  {release.description && (
                    <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                      {release.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {progress}%
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
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

const COLUMN_ACCENT: Record<string, string> = {
  BACKLOG: 'bg-blue-500',
  PLANNED: 'bg-indigo-500',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
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
          <Card
            key={column.status}
            className="p-0 overflow-hidden"
          >
            {/* Colored top accent bar */}
            <div className={cn('h-1', COLUMN_ACCENT[column.status] ?? 'bg-muted')} />

            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold font-heading text-foreground">
                  {column.label}
                </h4>
                <Badge variant="secondary">
                  {columnItems.length}
                </Badge>
              </div>
              {canWrite && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onAddItem(column.status)}
                  aria-label={`Add item to ${column.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Column items */}
            <div className="space-y-2 px-3 pb-3">
              {columnItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
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
          </Card>
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
    <Card className="p-0 hover:border-primary/20 transition-colors">
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h5 className="text-sm font-medium text-card-foreground leading-tight">
            {item.title}
          </h5>
          {item.priority > 0 && (
            <div className={cn('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-card', priorityColor)} />
          )}
        </div>

        {item.description && (
          <p className="mb-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.release && (
              <Badge variant="secondary" className="text-[10px] py-0">
                <Package2 className="h-2.5 w-2.5" />
                {item.release.name}
              </Badge>
            )}
            {item.priority > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground">
                P{item.priority}
              </span>
            )}
          </div>

          {/* Move menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Move item">
                <ChevronRight className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moveTargets.map((target) => (
                <DropdownMenuItem
                  key={target.status}
                  onClick={() => onMove(item.id, target.status)}
                >
                  {target.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
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
      <Card className="flex flex-col items-center justify-center py-16">
        <div className="brand-tint mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <List className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold font-heading text-muted-foreground">
          No items in this roadmap
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="px-4">Title</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="hidden px-4 sm:table-cell">Priority</TableHead>
            <TableHead className="hidden px-4 md:table-cell">Release</TableHead>
            <TableHead className="hidden px-4 lg:table-cell">Start Date</TableHead>
            <TableHead className="hidden px-4 lg:table-cell">End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell className="px-4 py-3 font-medium text-foreground">
                {item.title}
              </TableCell>
              <TableCell className="px-4 py-3">
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                {PRIORITY_LABELS[item.priority] ?? `P${item.priority}`}
              </TableCell>
              <TableCell className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {item.release?.name ?? '--'}
              </TableCell>
              <TableCell className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {formatDate(item.startDate)}
              </TableCell>
              <TableCell className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {formatDate(item.endDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
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
      <Card className="flex flex-col items-center justify-center py-16">
        <div className="brand-tint mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold font-heading text-muted-foreground">
          No items with dates to display on timeline
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Add start and end dates to roadmap items to see them here
        </p>
      </Card>
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
    BACKLOG: 'bg-blue-500/70',
    PLANNED: 'bg-indigo-500',
    IN_PROGRESS: 'bg-amber-500',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-gray-400',
  }

  return (
    <Card className="p-0">
      <CardContent className="p-6">
        {/* Timeline header */}
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="section-title">{formatDate(new Date(minDate))}</span>
          <span className="section-title">{formatDate(new Date(maxDate))}</span>
        </div>

        {/* Items */}
        <div className="space-y-3">
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
                <div className="w-36 shrink-0 truncate text-xs font-medium text-foreground">
                  {item.title}
                </div>
                <div className="relative h-7 flex-1 rounded-lg bg-muted/50">
                  <div
                    className={cn(
                      'absolute top-0 h-7 rounded-lg transition-all duration-200',
                      STATUS_COLORS[item.status] ?? 'bg-gray-400',
                    )}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white truncate px-2">
                      {item.title}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
