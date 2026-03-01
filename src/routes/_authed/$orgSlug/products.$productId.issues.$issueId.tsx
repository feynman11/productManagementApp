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
import { cn } from '~/lib/utils'

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
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)
  const userCanAdmin = canAdmin(parentData.clientUserRole as any)

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
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            navigate({
              to: '/$orgSlug/products/$productId/issues',
              params: { orgSlug, productId },
            })
          }
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Back to issues"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {issue.title}
            </h2>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Reported by {issue.reporterId.slice(0, 12)}...
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(issue.createdAt)}
            </span>
            {issue.assigneeId && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Assigned to {issue.assigneeId.slice(0, 12)}...
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
              {issue.description}
            </p>
          </div>

          {/* Comments */}
          <div className="rounded-lg border border-border bg-card p-5">
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          {userCanWrite && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                Status
              </h3>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:opacity-50',
                )}
              >
                {ISSUE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Severity */}
          {userCanWrite && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                Severity
              </h3>
              <select
                value={issue.severity}
                onChange={(e) => handleSeverityChange(e.target.value)}
                disabled={changingSeverity}
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:opacity-50',
                )}
              >
                {ISSUE_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignment */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Assignment
            </h3>
            {issue.assigneeId ? (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground font-mono">
                  {issue.assigneeId.slice(0, 12)}...
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
            {userCanAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">
                Assignment management will be available via the team selector.
              </p>
            )}
          </div>

          {/* Customer Impact */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Customers Affected
            </h3>
            <div className="flex items-center gap-3">
              {userCanWrite && (
                <button
                  onClick={() => handleCustomersChange(-1)}
                  disabled={updatingCustomers || issue.customersAffected <= 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  aria-label="Decrease customers affected"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {issue.customersAffected}
                </span>
              </div>
              {userCanWrite && (
                <button
                  onClick={() => handleCustomersChange(1)}
                  disabled={updatingCustomers}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  aria-label="Increase customers affected"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">
                  {formatDate(issue.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-foreground">
                  {formatDate(issue.updatedAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Comments</dt>
                <dd className="text-foreground">{issue.comments.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
