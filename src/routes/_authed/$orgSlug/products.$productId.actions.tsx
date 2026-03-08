import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Zap,
  Plus,
  X,
  Check,
  Calendar,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Clock,
  Filter,
  History,
} from 'lucide-react'
import {
  getProductActions,
  getActionItem,
  createActionItem,
  updateActionItem,
  addActionComment,
  deleteActionItem,
  getProductMembers,
} from '~/server/functions/actions'
import { canProductWrite } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/actions',
)({
  loader: ({ params }) =>
    Promise.all([
      getProductActions({ data: { productId: params.productId } }),
      getProductMembers({ data: { productId: params.productId } }),
    ]).then(([actions, members]) => ({ actions, members })),
  component: ActionsPage,
})

// ──────────────────────────────────────────────────────
// Types & Config
// ──────────────────────────────────────────────────────

type ActionItem = Awaited<ReturnType<typeof getProductActions>>[number]
type ActionDetail = Awaited<ReturnType<typeof getActionItem>>
type Member = Awaited<ReturnType<typeof getProductMembers>>[number]

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  DONE: { label: 'Done', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
}

const priorityConfig: Record<string, { label: string; color: string; order: number }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', order: 0 },
  HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', order: 1 },
  MEDIUM: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', order: 2 },
  LOW: { label: 'Low', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', order: 3 },
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return null
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(d: string | Date | null | undefined) {
  if (!d) return false
  return new Date(d) < new Date()
}

function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function relativeTime(d: string | Date) {
  const now = Date.now()
  const then = new Date(d).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ──────────────────────────────────────────────────────
// Action Detail Panel
// ──────────────────────────────────────────────────────

function ActionDetailPanel({
  action,
  productId,
  members,
  canEdit,
  onClose,
}: {
  action: ActionItem
  productId: string
  members: Member[]
  canEdit: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [detail, setDetail] = useState<ActionDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [status, setStatus] = useState(action.status)
  const [priority, setPriority] = useState(action.priority)
  const [title, setTitle] = useState(action.title)
  const [description, setDescription] = useState(action.description ?? '')
  const [dueDate, setDueDate] = useState(action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : '')
  const [assigneeId, setAssigneeId] = useState(action.assigneeId ?? '')
  const [saving, setSaving] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Load full detail with comments on mount
  useState(() => {
    setLoadingDetail(true)
    getActionItem({ data: { actionItemId: action.id, productId } })
      .then(setDetail)
      .finally(() => setLoadingDetail(false))
  })

  const hasChanges =
    title !== action.title ||
    description !== (action.description ?? '') ||
    status !== action.status ||
    priority !== action.priority ||
    dueDate !== (action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : '') ||
    assigneeId !== (action.assigneeId ?? '')

  async function reloadDetail() {
    const refreshed = await getActionItem({ data: { actionItemId: action.id, productId } })
    setDetail(refreshed)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateActionItem({
        data: {
          actionItemId: action.id,
          productId,
          title,
          description: description || undefined,
          status: status as any,
          priority: priority as any,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        },
      })
      await reloadDetail()
      router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSendingComment(true)
    try {
      const comment = await addActionComment({
        data: { actionItemId: action.id, productId, content: commentText },
      })
      setCommentText('')
      if (detail) {
        setDetail({ ...detail, comments: [...detail.comments, comment] })
      }
    } finally {
      setSendingComment(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this action item?')) return
    try {
      await deleteActionItem({ data: { actionItemId: action.id, productId } })
      onClose()
      router.invalidate()
    } catch { /* */ }
  }

  return (
    <Card className="p-0 overflow-hidden border-primary/15">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-500" />
          <span className="text-sm font-semibold font-heading">Action Detail</span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="icon-xs" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          {canEdit ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
          ) : (
            <p className="text-sm font-medium">{title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          {canEdit ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{description || 'No description'}</p>
          )}
        </div>

        {/* Status + Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            {canEdit ? (
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger size="sm" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={cn('text-[10px]', statusConfig[status]?.color)}>
                {statusConfig[status]?.label}
              </Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            {canEdit ? (
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger size="sm" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={cn('text-[10px]', priorityConfig[priority]?.color)}>
                {priorityConfig[priority]?.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Assignee + Due Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
            {canEdit ? (
              <Select value={assigneeId || '_none'} onValueChange={(v) => setAssigneeId(v === '_none' ? '' : v)}>
                <SelectTrigger size="sm" className="text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {action.assignee ? (
                  <>
                    <Avatar className="h-5 w-5">
                      {action.assignee.avatarUrl && <AvatarImage src={action.assignee.avatarUrl} />}
                      <AvatarFallback className="text-[8px]">{initials(action.assignee.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{action.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
            {canEdit ? (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            ) : (
              <span className={cn('text-xs', dueDate && isOverdue(dueDate) ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                {formatDate(dueDate) || 'No due date'}
              </span>
            )}
          </div>
        </div>

        {/* Raised by */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Raised by</span>
          <Avatar className="h-4 w-4">
            {action.raisedBy.avatarUrl && <AvatarImage src={action.raisedBy.avatarUrl} />}
            <AvatarFallback className="text-[7px]">{initials(action.raisedBy.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{action.raisedBy.name || action.raisedBy.email}</span>
        </div>

        {/* Save button */}
        {canEdit && hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="w-full">
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}

        {/* Comments section */}
        <div className="border-t border-border/40 pt-4 space-y-3">
          <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Comments
            {detail && detail.comments.length > 0 && (
              <span className="tabular-nums">({detail.comments.length})</span>
            )}
          </h5>

          {loadingDetail ? (
            <p className="text-xs text-muted-foreground animate-pulse">Loading comments...</p>
          ) : detail?.comments.length ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {detail.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-5 w-5 mt-0.5 shrink-0">
                    {c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} />}
                    <AvatarFallback className="text-[7px]">{initials(c.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{c.author.name || c.author.email}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No comments yet</p>
          )}

          {/* Add comment form */}
          {canEdit && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="h-8 text-xs flex-1"
              />
              <Button type="submit" size="icon-xs" disabled={sendingComment || !commentText.trim()}>
                <Send className="h-3 w-3" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Action Card
// ──────────────────────────────────────────────────────

function ActionCard({
  action,
  isSelected,
  onClick,
  index,
}: {
  action: ActionItem
  isSelected: boolean
  onClick: () => void
  index: number
}) {
  const st = statusConfig[action.status]
  const pr = priorityConfig[action.priority]
  const overdue = action.status !== 'DONE' && isOverdue(action.dueDate)

  // Compute last update summary from latest comment or updatedAt
  const latestComment = action.comments?.[0]
  const lastUpdate = latestComment
    ? `${latestComment.author?.name ?? 'Someone'} ${relativeTime(latestComment.createdAt)}: ${latestComment.content.split('\n')[0]}`
    : action.updatedAt !== action.createdAt
      ? `Updated ${relativeTime(action.updatedAt)}`
      : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-4 transition-all duration-200 cursor-pointer',
        isSelected
          ? 'border-primary/30 bg-primary/5 shadow-sm'
          : 'border-border/50 hover:border-primary/15 hover:bg-accent/30',
      )}
      style={{ animation: `dash-fade-in 0.35s ease-out ${index * 0.04}s both` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', st?.dotColor)} />
            <span className="text-sm font-medium text-foreground truncate">{action.title}</span>
          </div>
          {action.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 ml-3.5">{action.description}</p>
          )}
        </div>
        <Badge className={cn('text-[10px] shrink-0', pr?.color)}>
          {pr?.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mt-2.5 ml-3.5 flex-wrap">
        <Badge className={cn('text-[10px]', st?.color)}>{st?.label}</Badge>

        {action.assignee && (
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              {action.assignee.avatarUrl && <AvatarImage src={action.assignee.avatarUrl} />}
              <AvatarFallback className="text-[7px]">{initials(action.assignee.name)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{action.assignee.name}</span>
          </div>
        )}

        {action.dueDate && (
          <div className={cn('flex items-center gap-1 text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            <Calendar className="h-3 w-3" />
            {formatDate(action.dueDate)}
          </div>
        )}

        {action._count.comments > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {action._count.comments}
          </div>
        )}

        {/* Last update summary */}
        {lastUpdate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 ml-auto">
            <History className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{lastUpdate}</span>
          </div>
        )}
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────────────
// Add Action Form
// ──────────────────────────────────────────────────────

function AddActionForm({
  productId,
  members,
  onClose,
  onSuccess,
}: {
  productId: string
  members: Member[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createActionItem({
        data: {
          productId,
          title,
          description: description || undefined,
          priority: priority as any,
          dueDate: dueDate || undefined,
          assigneeId: assigneeId || undefined,
        },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create action item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold font-heading text-foreground">New Action Item</h4>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="What needs to be done?"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe the action item..."
            className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Assign To</label>
            <Select value={assigneeId || '_none'} onValueChange={(v) => setAssigneeId(v === '_none' ? '' : v)}>
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    {m.user.name || m.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="xs" disabled={submitting || !title.trim()}>
            {submitting ? 'Creating...' : 'Create Action'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Priority Filter Pills
// ──────────────────────────────────────────────────────

const priorityFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'URGENT', label: 'Urgent', dotColor: 'bg-red-500' },
  { value: 'HIGH', label: 'High', dotColor: 'bg-orange-500' },
  { value: 'MEDIUM', label: 'Medium', dotColor: 'bg-amber-400' },
  { value: 'LOW', label: 'Low', dotColor: 'bg-slate-400' },
]

function PriorityFilter({
  value,
  onChange,
  actions,
}: {
  value: string
  onChange: (v: string) => void
  actions: ActionItem[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
      {priorityFilterOptions.map((opt) => {
        const count = opt.value === 'all'
          ? actions.length
          : actions.filter((a) => a.priority === opt.value).length
        if (count === 0 && opt.value !== 'all') return null
        return (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? 'all' : opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              value === opt.value
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )}
          >
            {opt.dotColor && <div className={cn('h-2 w-2 rounded-full', opt.dotColor)} />}
            {opt.label}
            <span className="tabular-nums text-[10px] opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────

function ActionsPage() {
  const { actions, members } = Route.useLoaderData()
  const { productId } = Route.useParams()
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const router = useRouter()

  const canEdit = canProductWrite(productRole ?? null)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [filterPriority, setFilterPriority] = useState('all')

  // Actions visible before priority filter (used for filter counts)
  const visibleActions = actions.filter((a) => {
    if (!showDone && a.status === 'DONE') return false
    return true
  })

  const filteredActions = visibleActions.filter((a) => {
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false
    return true
  })

  const selectedAction = actions.find((a) => a.id === selectedId)
  const doneCount = actions.filter((a) => a.status === 'DONE').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-500" />
          <h3 className="font-heading font-semibold text-foreground">
            Actions
            {actions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({actions.length - doneCount} open{doneCount > 0 ? `, ${doneCount} done` : ''})
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <button
              onClick={() => setShowDone(!showDone)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                showDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {showDone ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {showDone ? 'Showing done' : 'Show done'}
            </button>
          )}
          {canEdit && !showAdd && (
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Action
            </Button>
          )}
        </div>
      </div>

      {/* Priority filter */}
      {visibleActions.length > 0 && (
        <PriorityFilter
          value={filterPriority}
          onChange={setFilterPriority}
          actions={visibleActions}
        />
      )}

      {/* Add form */}
      {showAdd && (
        <AddActionForm
          productId={productId}
          members={members}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            router.invalidate()
          }}
        />
      )}

      {/* Content */}
      {actions.length > 0 ? (
        <div className={cn('gap-4', selectedAction ? 'grid lg:grid-cols-[1fr,380px]' : '')}>
          {/* Actions list */}
          <div className="space-y-2">
            {filteredActions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                isSelected={action.id === selectedId}
                onClick={() => setSelectedId(action.id === selectedId ? null : action.id)}
                index={index}
              />
            ))}
            {filteredActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No action items match the current filters.
              </p>
            )}
          </div>

          {/* Detail panel */}
          {selectedAction && (
            <div className="hidden lg:block">
              <ActionDetailPanel
                key={selectedAction.id}
                action={selectedAction}
                productId={productId}
                members={members}
                canEdit={canEdit}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>
      ) : (
        !showAdd && (
          <Card className="items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 mb-3">
              <Zap className="h-6 w-6 text-cyan-500" />
            </div>
            <h4 className="font-heading font-semibold text-foreground mb-1">No action items yet</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Create action items to track tasks, decisions, and follow-ups.
            </p>
            {canEdit && (
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Action
              </Button>
            )}
          </Card>
        )
      )}

      {/* Mobile detail panel */}
      {selectedAction && (
        <div className="lg:hidden">
          <ActionDetailPanel
            key={selectedAction.id}
            action={selectedAction}
            productId={productId}
            members={members}
            canEdit={canEdit}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  )
}
