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
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { getIdeas, createIdea } from '~/server/functions/ideas'
import { exportIdeasCsv } from '~/server/functions/export'
import { downloadFile } from '~/lib/download'
import { StatusBadge } from '~/components/common/status-badge'
import { canProductContribute } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
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
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const navigate = useNavigate()

  const userCanWrite = canProductContribute(productRole ?? null)

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

  async function handleExportCsv() {
    const result = await exportIdeasCsv({ data: { productId } })
    downloadFile(result.csv, result.filename)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="page-heading">Ideas</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Collect and prioritize product ideas ({ideas.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {userCanWrite && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Submit Idea
            </Button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-heading">
              New Idea
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
              <div className="mb-5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label className="section-title">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="What is your idea?"
                />
              </div>
              <div className="space-y-2">
                <label className="section-title">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe your idea in detail..."
                  className="h-auto w-full min-w-0 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
              </div>
              <div className="space-y-2">
                <label className="section-title">
                  Tags
                </label>
                <Input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Comma-separated tags (e.g., ux, performance, mobile)"
                />
              </div>
              <div className="flex justify-end gap-3">
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
                  disabled={creating || !newTitle.trim() || !newDescription.trim()}
                >
                  {creating ? 'Submitting...' : 'Submit Idea'}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="CONVERTED">Converted to Feature</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Newest First" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="riceScore">RICE Score</SelectItem>
              <SelectItem value="votes">Most Votes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ideas list */}
      {filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <Lightbulb className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {ideas.length === 0
              ? 'No ideas yet'
              : 'No ideas match your filters'}
          </p>
          {ideas.length === 0 && userCanWrite && (
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="mt-5"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit your first idea
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filteredIdeas.map((idea) => (
              <Link
                key={idea.id}
                to={idea.status === 'CONVERTED' && idea.convertedToItem
                  ? '/$orgSlug/products/$productId/features/$featureId'
                  : '/$orgSlug/products/$productId/ideas/$ideaId'}
                params={idea.status === 'CONVERTED' && idea.convertedToItem
                  ? { orgSlug, productId, featureId: idea.convertedToItem.id }
                  : { orgSlug, productId, ideaId: idea.id }}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-foreground font-heading">
                        {idea.title}
                      </h4>
                      <StatusBadge status={idea.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp className="h-3 w-3" />
                        {idea.votes}
                      </span>
                      {idea.riceScore != null && (
                        <span>RICE: {idea.riceScore.toFixed(1)}</span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        {idea._count.comments}
                      </span>
                      <span>{formatDate(idea.createdAt)}</span>
                    </div>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {idea.tags.map((tag: any) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table layout */}
          <Card className="hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">RICE Score</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdeas.map((idea) => (
                  <TableRow
                    key={idea.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (idea.status === 'CONVERTED' && idea.convertedToItem) {
                        navigate({
                          to: '/$orgSlug/products/$productId/features/$featureId',
                          params: { orgSlug, productId, featureId: idea.convertedToItem.id },
                        })
                      } else {
                        navigate({
                          to: '/$orgSlug/products/$productId/ideas/$ideaId',
                          params: { orgSlug, productId, ideaId: idea.id },
                        })
                      }
                    }}
                  >
                    <TableCell>
                      <div>
                        <span className="text-sm font-semibold text-foreground font-heading">
                          {idea.title}
                        </span>
                        {idea.tags && idea.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {idea.tags.slice(0, 3).map((tag: any) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-[10px] px-2 py-0"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={idea.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {idea.riceScore != null
                          ? idea.riceScore.toFixed(1)
                          : '--'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {idea.votes}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(idea.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
