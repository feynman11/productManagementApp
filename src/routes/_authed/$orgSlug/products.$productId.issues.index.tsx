import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AlertCircle,
  Plus,
  Filter,
  MessageSquare,
  Users,
  X,
} from 'lucide-react'
import { getIssues, createIssue } from '~/server/functions/issues'
import { StatusBadge } from '~/components/common/status-badge'
import { SeverityBadge } from '~/components/common/severity-badge'
import { canWrite } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/issues/',
)({
  loader: ({ params }) =>
    getIssues({ data: { productId: params.productId } }),
  component: IssuesPage,
})

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function IssuesPage() {
  const issues = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)

  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSeverity, setNewSeverity] = useState('MEDIUM')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus =
      statusFilter === 'ALL' || issue.status === statusFilter
    const matchesSeverity =
      severityFilter === 'ALL' || issue.severity === severityFilter
    return matchesStatus && matchesSeverity
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await createIssue({
        data: {
          productId,
          title: newTitle,
          description: newDescription,
          severity: newSeverity as any,
        },
      })
      setShowCreate(false)
      setNewTitle('')
      setNewDescription('')
      setNewSeverity('MEDIUM')
      navigate({
        to: '/$orgSlug/products/$productId/issues',
        params: { orgSlug, productId },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create issue'
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
          Issues ({issues.length})
        </h3>
        {userCanWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Report Issue
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-card-foreground">
              Report Issue
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
                placeholder="Briefly describe the issue"
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
                placeholder="Provide detailed steps to reproduce, expected vs actual behavior..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Severity
              </label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
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
                disabled={
                  creating || !newTitle.trim() || !newDescription.trim()
                }
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {creating ? 'Reporting...' : 'Report Issue'}
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
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="WONT_FIX">Won't Fix</option>
        </select>
      </div>

      {/* Issues table */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {issues.length === 0
              ? 'No issues reported yet'
              : 'No issues match your filters'}
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
              Severity
            </div>
            <div className="col-span-2 text-xs font-medium text-muted-foreground">
              Status
            </div>
            <div className="col-span-2 text-xs font-medium text-muted-foreground">
              Affected
            </div>
            <div className="col-span-2 text-xs font-medium text-muted-foreground text-right">
              Created
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                to="/$orgSlug/products/$productId/issues/$issueId"
                params={{ orgSlug, productId, issueId: issue.id }}
                className="block bg-card transition-colors hover:bg-muted/30"
              >
                {/* Mobile layout */}
                <div className="flex flex-col gap-2 p-4 sm:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {issue.title}
                    </h4>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <StatusBadge status={issue.status} />
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {issue.customersAffected} affected
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {issue._count.comments}
                    </span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 sm:px-4 sm:py-3">
                  <div className="col-span-4">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {issue.title}
                    </h4>
                    {issue.assigneeId && (
                      <span className="text-xs text-muted-foreground">
                        Assigned
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={issue.status} />
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {issue.customersAffected}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(issue.createdAt)}
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
