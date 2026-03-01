import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
  ArrowRightCircle,
} from 'lucide-react'
import {
  getIdea,
  updateIdea,
  updateIdeaStatus,
  voteIdea,
  addIdeaComment,
  promoteToRoadmap,
} from '~/server/functions/ideas'
import { getRoadmaps } from '~/server/functions/roadmap'
import { StatusBadge } from '~/components/common/status-badge'
import { CommentThread } from '~/components/common/comment-thread'
import { RiceScoreCard } from '~/components/ideas/rice-score-card'
import { IdeaVoteButton } from '~/components/ideas/idea-vote-button'
import { canWrite, canAdmin } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/ideas/$ideaId',
)({
  loader: async ({ params }) => {
    const [idea, roadmaps] = await Promise.all([
      getIdea({ data: { ideaId: params.ideaId } }),
      getRoadmaps({ data: { productId: params.productId } }),
    ])
    return { idea, roadmaps }
  },
  component: IdeaDetailPage,
})

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const IDEA_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'DUPLICATE',
] as const

function IdeaDetailPage() {
  const { idea, roadmaps } = Route.useLoaderData()
  const { orgSlug, productId, ideaId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)
  const userCanAdmin = canAdmin(parentData.clientUserRole as any)

  const [changingStatus, setChangingStatus] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(
    roadmaps[0]?.id ?? '',
  )
  const [showPromote, setShowPromote] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setChangingStatus(true)
    try {
      await updateIdeaStatus({
        data: { ideaId, status: newStatus as any },
      })
      navigate({
        to: '/$orgSlug/products/$productId/ideas/$ideaId',
        params: { orgSlug, productId, ideaId },
      })
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleRiceSave(values: {
    riceReach: number
    riceImpact: number
    riceConfidence: number
    riceEffort: number
  }) {
    await updateIdea({
      data: { ideaId, ...values },
    })
    navigate({
      to: '/$orgSlug/products/$productId/ideas/$ideaId',
      params: { orgSlug, productId, ideaId },
    })
  }

  async function handleVote() {
    await voteIdea({ data: { ideaId } })
  }

  async function handleAddComment(content: string) {
    await addIdeaComment({ data: { ideaId, content } })
    navigate({
      to: '/$orgSlug/products/$productId/ideas/$ideaId',
      params: { orgSlug, productId, ideaId },
    })
  }

  async function handlePromote() {
    if (!selectedRoadmapId) return
    setPromoting(true)
    try {
      await promoteToRoadmap({
        data: { ideaId, roadmapId: selectedRoadmapId },
      })
      navigate({
        to: '/$orgSlug/products/$productId/ideas/$ideaId',
        params: { orgSlug, productId, ideaId },
      })
    } finally {
      setPromoting(false)
      setShowPromote(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            navigate({
              to: '/$orgSlug/products/$productId/ideas',
              params: { orgSlug, productId },
            })
          }
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Back to ideas"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {idea.title}
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={idea.status} />
              <IdeaVoteButton
                votes={idea.votes}
                onVote={handleVote}
                canVote={userCanWrite}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {idea.authorId.slice(0, 12)}...
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(idea.createdAt)}
            </span>
            {idea.tags && idea.tags.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {idea.tags.map((t: any) => t.name).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="rounded-lg border border-border bg-card p-5">
            <CommentThread
              comments={idea.comments.map((c: any) => ({
                id: c.id,
                content: c.content,
                authorId: c.authorId,
                createdAt: c.createdAt,
              }))}
              onAddComment={handleAddComment}
              canComment={userCanWrite}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status change */}
          {userCanAdmin && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                Status
              </h3>
              <select
                value={idea.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:opacity-50',
                )}
              >
                {IDEA_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* RICE Score */}
          <RiceScoreCard
            reach={idea.riceReach}
            impact={idea.riceImpact}
            confidence={idea.riceConfidence}
            effort={idea.riceEffort}
            score={idea.riceScore}
            editable={userCanWrite}
            onSave={handleRiceSave}
          />

          {/* Promote to Roadmap */}
          {userCanAdmin &&
            roadmaps.length > 0 &&
            idea.status !== 'PLANNED' &&
            idea.status !== 'COMPLETED' && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                  Promote to Roadmap
                </h3>
                {showPromote ? (
                  <div className="space-y-3">
                    <select
                      value={selectedRoadmapId}
                      onChange={(e) => setSelectedRoadmapId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {roadmaps.map((rm: any) => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePromote}
                        disabled={promoting || !selectedRoadmapId}
                        className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {promoting ? 'Promoting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setShowPromote(false)}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPromote(true)}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ArrowRightCircle className="h-4 w-4" />
                    Promote to Roadmap
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
