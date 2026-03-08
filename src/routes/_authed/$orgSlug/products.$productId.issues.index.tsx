import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AlertCircle,
  Plus,
  Filter,
  MessageSquare,
  Users,
  X,
  Download,
} from 'lucide-react'
import { getIssues, createIssue } from '~/server/functions/issues'
import { exportIssuesCsv } from '~/server/functions/export'
import { downloadFile } from '~/lib/download'
import { StatusBadge } from '~/components/common/status-badge'
import { SeverityBadge } from '~/components/common/severity-badge'
import { canProductWrite } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'

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
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const navigate = useNavigate()

  const userCanWrite = canProductWrite(productRole ?? null)

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

  async function handleExportCsv() {
    const result = await exportIssuesCsv({ data: { productId } })
    downloadFile(result.csv, result.filename, 'text/csv')
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="page-heading">Issues</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track and resolve reported issues ({issues.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                Download CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {userCanWrite && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Report Issue
            </Button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-heading">
              Report Issue
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowCreate(false)
                setCreateError('')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {createError && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="Briefly describe the issue"
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
                  className="h-auto w-full min-w-0 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Severity
                </label>
                <Select value={newSeverity} onValueChange={setNewSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateError('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    creating || !newTitle.trim() || !newDescription.trim()
                  }
                >
                  {creating ? 'Reporting...' : 'Report Issue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="WONT_FIX">Won't Fix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues table */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {issues.length === 0
              ? 'No issues reported yet'
              : 'No issues match your filters'}
          </p>
          {issues.length === 0 && userCanWrite && (
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="mt-5"
            >
              <Plus className="h-3.5 w-3.5" />
              Report your first issue
            </Button>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          {/* Mobile layout */}
          <div className="divide-y divide-border/60 sm:hidden">
            {filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                to="/$orgSlug/products/$productId/issues/$issueId"
                params={{ orgSlug, productId, issueId: issue.id }}
                className="group block transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col gap-2.5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-foreground font-heading leading-snug">
                      {issue.title}
                    </h4>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <StatusBadge status={issue.status} />
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {issue.customersAffected} affected
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" />
                      {issue._count.comments}
                    </span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow key={issue.id} className="group">
                  <TableCell>
                    <Link
                      to="/$orgSlug/products/$productId/issues/$issueId"
                      params={{ orgSlug, productId, issueId: issue.id }}
                      className="block"
                    >
                      <h4 className="text-sm font-semibold text-foreground font-heading truncate group-hover:text-primary transition-colors">
                        {issue.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        {issue.assignee && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                            {issue.assignee.name || issue.assignee.email || 'Assigned'}
                          </span>
                        )}
                        {issue._count.comments > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {issue._count.comments}
                          </span>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={issue.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {issue.customersAffected}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(issue.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
