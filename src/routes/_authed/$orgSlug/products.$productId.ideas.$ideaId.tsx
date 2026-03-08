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
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'

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
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
  const navigate = useNavigate()

  const userCanWrite = canWrite(role as any, isDemo)
  const userCanAdmin = canAdmin(role as any, isDemo)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            aria-label="Back to ideas"
            onClick={() =>
              navigate({
                to: '/$orgSlug/products/$productId/ideas',
                params: { orgSlug, productId },
              })
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="page-heading">{idea.title}</h2>
            {/* Meta info */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
                {idea.authorId.slice(0, 12)}...
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(idea.createdAt)}
              </span>
              {idea.tags && idea.tags.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {idea.tags.map((t: any) => t.name).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status + Vote */}
        <div className="flex items-center gap-3">
          <StatusBadge status={idea.status} />
          <IdeaVoteButton
            votes={idea.votes}
            onVote={handleVote}
            canVote={userCanWrite}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {idea.description}
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag: any) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="bg-primary/8 text-primary border-primary/15"
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Comments */}
          <Card>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status change */}
          {userCanAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-tint">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </div>
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={idea.status}
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IDEA_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ArrowRightCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    Promote to Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showPromote ? (
                    <div className="space-y-3">
                      <Select
                        value={selectedRoadmapId}
                        onValueChange={setSelectedRoadmapId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roadmaps.map((rm: any) => (
                            <SelectItem key={rm.id} value={rm.id}>
                              {rm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handlePromote}
                          disabled={promoting || !selectedRoadmapId}
                          className="flex-1"
                        >
                          {promoting ? 'Promoting...' : 'Confirm'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowPromote(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setShowPromote(true)}
                    >
                      <ArrowRightCircle className="h-4 w-4" />
                      Promote to Roadmap
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
