import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Lightbulb,
  Rocket,
  Tag,
} from 'lucide-react'
import { getFeature, addFeatureComment, updateRoadmapItem } from '~/server/functions/roadmap'
import { StatusBadge } from '~/components/common/status-badge'
import { CommentThread } from '~/components/common/comment-thread'
import { canProductWrite, canProductAdmin } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/features/$featureId',
)({
  loader: async ({ params }) => {
    const feature = await getFeature({ data: { featureId: params.featureId } })
    return { feature }
  },
  component: FeatureDetailPage,
})

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const FEATURE_STATUSES = [
  'BACKLOG',
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const

function FeatureDetailPage() {
  const { feature } = Route.useLoaderData()
  const { orgSlug, productId, featureId } = Route.useParams()
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const navigate = useNavigate()

  const userCanWrite = canProductWrite(productRole ?? null)
  const userCanAdmin = canProductAdmin(productRole ?? null)

  const [changingStatus, setChangingStatus] = useState(false)

  const sourceIdea = feature.sourceIdea

  // Merge idea-phase and feature-phase comments with phase labels
  const allComments = [
    ...(sourceIdea?.comments ?? []).map((c: any) => ({ ...c, phase: 'idea' as const })),
    ...feature.comments.map((c: any) => ({ ...c, phase: 'feature' as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  async function handleStatusChange(newStatus: string) {
    setChangingStatus(true)
    try {
      await updateRoadmapItem({
        data: { itemId: featureId, status: newStatus as any },
      })
      navigate({
        to: '/$orgSlug/products/$productId/features/$featureId',
        params: { orgSlug, productId, featureId },
      })
    } catch {
      // Status changes for non-BACKLOG may fail if missing release/dates
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleAddComment(content: string) {
    await addFeatureComment({ data: { featureId, content } })
    navigate({
      to: '/$orgSlug/products/$productId/features/$featureId',
      params: { orgSlug, productId, featureId },
    })
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
            aria-label="Back to features"
            onClick={() =>
              navigate({
                to: '/$orgSlug/products/$productId/features',
                params: { orgSlug, productId },
              })
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="page-heading">{feature.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {formatDate(feature.createdAt)}
              </span>
              {feature.release && (
                <span className="inline-flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  {feature.release.name}
                </span>
              )}
              {feature.startDate && feature.endDate && (
                <span className="text-muted-foreground/60">
                  {formatDate(feature.startDate)} &mdash; {formatDate(feature.endDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={feature.status} />
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
                {feature.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Source idea info */}
          {sourceIdea && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Converted from Idea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar size="sm">
                      {sourceIdea.author?.avatarUrl && (
                        <AvatarImage src={sourceIdea.author.avatarUrl} alt={sourceIdea.author?.name || ''} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(sourceIdea.author?.name || sourceIdea.author?.email || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    Submitted by {sourceIdea.author?.name || sourceIdea.author?.email || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(sourceIdea.createdAt)}
                  </span>
                </div>
                {sourceIdea.tags && sourceIdea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sourceIdea.tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]"
                      >
                        <Tag className="h-3 w-3" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {sourceIdea.riceScore != null && (
                  <p className="text-xs text-muted-foreground">
                    RICE Score: <span className="font-semibold text-foreground">{sourceIdea.riceScore.toFixed(1)}</span>
                    {' '}&middot; {sourceIdea.votes} vote{sourceIdea.votes !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments (merged from both phases) */}
          <Card>
            <CardContent>
              <CommentThread
                comments={allComments}
                onAddComment={handleAddComment}
                canComment={userCanWrite}
                showPhaseLabels={!!sourceIdea}
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
                  value={feature.status}
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Feature details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Rocket className="h-4 w-4 text-blue-500" />
                </div>
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium">{feature.priority || 'None'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Release</span>
                <span className="font-medium">{feature.release?.name || 'Unassigned'}</span>
              </div>
              {feature.startDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium">{formatDate(feature.startDate)}</span>
                </div>
              )}
              {feature.endDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End</span>
                  <span className="font-medium">{formatDate(feature.endDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
