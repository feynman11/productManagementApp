import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Map,
  Plus,
  Layers,
  Package2,
  Globe,
  Lock,
  X,
} from 'lucide-react'
import { getRoadmaps, createRoadmap } from '~/server/functions/roadmap'
import { canWrite } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/roadmap/',
)({
  loader: ({ params }) =>
    getRoadmaps({ data: { productId: params.productId } }),
  component: RoadmapListPage,
})

function RoadmapListPage() {
  const roadmaps = Route.useLoaderData()
  const { orgSlug, productId } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const userCanWrite = canWrite(parentData.clientUserRole as any)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newIsPublic, setNewIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await createRoadmap({
        data: {
          productId,
          name: newName,
          description: newDescription || undefined,
          isPublic: newIsPublic,
        },
      })
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      setNewIsPublic(false)
      navigate({
        to: '/$orgSlug/products/$productId/roadmap',
        params: { orgSlug, productId },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create roadmap'
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
          Roadmaps ({roadmaps.length})
        </h3>
        {userCanWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Roadmap
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-card-foreground">
              New Roadmap
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
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g., Q1 2026 Roadmap"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                placeholder="What is this roadmap about?"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="roadmap-public"
                checked={newIsPublic}
                onChange={(e) => setNewIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label
                htmlFor="roadmap-public"
                className="text-sm font-medium text-foreground"
              >
                Make this roadmap public
              </label>
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
                disabled={creating || !newName.trim()}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Roadmap'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roadmaps grid */}
      {roadmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Map className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No roadmaps yet
          </p>
          {userCanWrite && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create your first roadmap
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roadmaps.map((roadmap) => (
            <Link
              key={roadmap.id}
              to="/$orgSlug/products/$productId/roadmap/$roadmapId"
              params={{ orgSlug, productId, roadmapId: roadmap.id }}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-base font-semibold text-card-foreground group-hover:text-accent-foreground">
                    {roadmap.name}
                  </h4>
                </div>
                {roadmap.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Private
                  </span>
                )}
              </div>

              {roadmap.description && (
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {roadmap.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {roadmap._count.items} items
                </span>
                <span className="inline-flex items-center gap-1">
                  <Package2 className="h-3.5 w-3.5" />
                  {roadmap._count.releases} releases
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
