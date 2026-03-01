import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Lightbulb,
  Plus,
  ThumbsUp,
  MessageSquare,
  ArrowUpDown,
  Filter,
  X,
} from 'lucide-react'
import { getIdeas, createIdea } from '~/server/functions/ideas'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/ideas/',
)({
  loader: ({ params }) =>
    getIdeas({ data: { productId: params.productId, sortBy: 'createdAt' } }),
  component: IdeasPage,
})

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function IdeasPage() {
  const ideas = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)

  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const filteredIdeas = ideas
    .filter((idea) => statusFilter === 'ALL' || idea.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'riceScore')
        return (b.riceScore ?? 0) - (a.riceScore ?? 0)
      if (sortBy === 'votes') return b.votes - a.votes
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await createIdea({
        data: {
          productId,
          title: newTitle,
          description: newDescription,
          tags: tags.length > 0 ? tags : undefined,
        },
      })
      setShowCreate(false)
      setNewTitle('')
      setNewDescription('')
      setNewTags('')
      navigate({
        to: '/$orgSlug/products/$productId/ideas',
        params: { orgSlug, productId },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create idea'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Ideas ({ideas.length})
        </h3>
        {userCanWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Submit Idea
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-card-foreground">
              New Idea
            </h4>
            <button
              onClick={() => {
                setShowCreate(false)
                setCreateError('')
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {createError && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="What is your idea?"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe your idea in detail..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tags
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., ux, performance, mobile)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setCreateError('')
                }}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim() || !newDescription.trim()}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {creating ? 'Submitting...' : 'Submit Idea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="DUPLICATE">Duplicate</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="createdAt">Newest First</option>
            <option value="riceScore">RICE Score</option>
            <option value="votes">Most Votes</option>
          </select>
        </div>
      </div>

      {/* Ideas list */}
      {filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Lightbulb className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {ideas.length === 0
              ? 'No ideas yet'
              : 'No ideas match your filters'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* Table header - hidden on mobile */}
          <div className="hidden border-b border-border bg-muted/50 sm:grid sm:grid-cols-12 sm:gap-2 sm:px-4 sm:py-3">
            <div className="col-span-4 text-xs font-medium text-muted-foreground">
              Title
            </div>
            <div className="col-span-2 text-xs font-medium text-muted-foreground">
              Status
            </div>
            <div className="col-span-2 text-xs font-medium text-muted-foreground text-right">
              RICE Score
            </div>
            <div className="col-span-1 text-xs font-medium text-muted-foreground text-right">
              Votes
            </div>
            <div className="col-span-3 text-xs font-medium text-muted-foreground text-right">
              Created
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredIdeas.map((idea) => (
              <Link
                key={idea.id}
                to="/$orgSlug/products/$productId/ideas/$ideaId"
                params={{ orgSlug, productId, ideaId: idea.id }}
                className="block bg-card transition-colors hover:bg-muted/30"
              >
                {/* Mobile layout */}
                <div className="flex flex-col gap-2 p-4 sm:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {idea.title}
                    </h4>
                    <StatusBadge status={idea.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {idea.votes}
                    </span>
                    {idea.riceScore != null && (
                      <span>RICE: {idea.riceScore.toFixed(1)}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {idea._count.comments}
                    </span>
                    <span>{formatDate(idea.createdAt)}</span>
                  </div>
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 sm:px-4 sm:py-3">
                  <div className="col-span-4">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {idea.title}
                    </h4>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {idea.tags.slice(0, 3).map((tag: any) => (
                          <span
                            key={tag.id}
                            className="inline-flex rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={idea.status} />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {idea.riceScore != null
                        ? idea.riceScore.toFixed(1)
                        : '--'}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      {idea.votes}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(idea.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
