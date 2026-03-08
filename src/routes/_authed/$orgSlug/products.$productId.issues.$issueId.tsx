import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  User,
  Calendar,
  Users,
  Minus,
  Plus,
} from 'lucide-react'
import { getIssue, updateIssue, addIssueComment } from '~/server/functions/issues'
import { StatusBadge } from '~/components/common/status-badge'
import { SeverityBadge } from '~/components/common/severity-badge'
import { CommentThread } from '~/components/common/comment-thread'
import { canWrite, canAdmin } from '~/lib/permissions'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/issues/$issueId',
)({
  loader: ({ params }) => getIssue({ data: { issueId: params.issueId } }),
  component: IssueDetailPage,
})

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const ISSUE_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'WONT_FIX',
] as const

const ISSUE_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

function IssueDetailPage() {
  const issue = Route.useLoaderData()
  const { orgSlug, productId, issueId } = Route.useParams()
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
  const navigate = useNavigate()

  const userCanWrite = canWrite(role as any, isDemo)
  const userCanAdmin = canAdmin(role as any, isDemo)

  const [changingStatus, setChangingStatus] = useState(false)
  const [changingSeverity, setChangingSeverity] = useState(false)
  const [updatingCustomers, setUpdatingCustomers] = useState(false)

  function refreshPage() {
    navigate({
      to: '/$orgSlug/products/$productId/issues/$issueId',
      params: { orgSlug, productId, issueId },
    })
  }

  async function handleStatusChange(newStatus: string) {
    setChangingStatus(true)
    try {
      await updateIssue({
        data: { issueId, status: newStatus as any },
      })
      refreshPage()
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleSeverityChange(newSeverity: string) {
    setChangingSeverity(true)
    try {
      await updateIssue({
        data: { issueId, severity: newSeverity as any },
      })
      refreshPage()
    } finally {
      setChangingSeverity(false)
    }
  }

  async function handleCustomersChange(delta: number) {
    const newCount = Math.max(0, issue.customersAffected + delta)
    setUpdatingCustomers(true)
    try {
      await updateIssue({
        data: { issueId, customersAffected: newCount },
      })
      refreshPage()
    } finally {
      setUpdatingCustomers(false)
    }
  }

  async function handleAddComment(content: string) {
    await addIssueComment({ data: { issueId, content } })
    refreshPage()
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
            aria-label="Back to issues"
            onClick={() =>
              navigate({
                to: '/$orgSlug/products/$productId/issues',
                params: { orgSlug, productId },
              })
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="page-heading">{issue.title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
            </div>
            {/* Meta info */}
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Reported by {issue.reporterId.slice(0, 12)}...
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(issue.createdAt)}
              </span>
              {issue.assigneeId && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Assigned to {issue.assigneeId.slice(0, 12)}...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {issue.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardContent>
              <CommentThread
                comments={issue.comments.map((c: any) => ({
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
          {/* Status */}
          {userCanWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-tint">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={issue.status}
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Severity */}
          {userCanWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  </div>
                  Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={issue.severity}
                  onValueChange={handleSeverityChange}
                  disabled={changingSeverity}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issue.assigneeId ? (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3.5 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {issue.assigneeId.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground font-mono text-xs">
                    {issue.assigneeId.slice(0, 12)}...
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
              {userCanAdmin && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Assignment management will be available via the team selector.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Customer Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <Users className="h-4 w-4 text-red-500" />
                </div>
                Customers Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {userCanWrite && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCustomersChange(-1)}
                    disabled={updatingCustomers || issue.customersAffected <= 0}
                    aria-label="Decrease customers affected"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground font-heading tabular-nums">
                    {issue.customersAffected}
                  </span>
                </div>
                {userCanWrite && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCustomersChange(1)}
                    disabled={updatingCustomers}
                    aria-label="Increase customers affected"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-sm font-heading">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-tint">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center rounded-lg bg-muted/40 px-3.5 py-2">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="text-foreground font-medium">
                    {formatDate(issue.createdAt)}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between items-center rounded-lg bg-muted/40 px-3.5 py-2">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-foreground font-medium">
                    {formatDate(issue.updatedAt)}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between items-center rounded-lg bg-muted/40 px-3.5 py-2">
                  <dt className="text-muted-foreground">Comments</dt>
                  <dd className="text-foreground font-medium">{issue.comments.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
