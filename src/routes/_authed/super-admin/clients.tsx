import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import {
  getClients,
  createClient,
  suspendClient,
} from '~/server/functions/clients'
import { cn } from '~/lib/utils'

const searchSchema = z.object({
  page: z.number().int().positive().catch(1),
})

export const Route = createFileRoute('/_authed/super-admin/clients')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => getClients({ data: { page: deps.page, limit: 20 } }),
  component: ClientsPage,
})

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  INACTIVE: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  PENDING_SETUP: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  SUSPENDED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

function ClientsPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const { page } = Route.useSearch()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const totalPages = Math.ceil(data.total / data.limit)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await createClient({ data: { name: newName, slug: newSlug } })
      setShowCreate(false)
      setNewName('')
      setNewSlug('')
      // Refresh data by re-navigating to the same page
      navigate({ to: '/super-admin/clients', search: { page } })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create client'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  async function handleSuspend(clientId: string) {
    if (!confirm('Are you sure you want to suspend this client?')) return
    try {
      await suspendClient({ data: { clientId } })
      navigate({ to: '/super-admin/clients', search: { page } })
    } catch {
      // Silently fail for now -- error handling will improve with toast notifications
    }
  }

  function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Clients
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage all client organizations ({data.total} total)
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create Client
        </button>
      </div>

      {/* Create client form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            New Client
          </h3>
          {createError && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="client-name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="client-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Acme Corp"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="client-slug" className="text-sm font-medium text-foreground">
                Slug
              </label>
              <input
                id="client-slug"
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
                pattern="^[a-z0-9-]+$"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="acme-corp"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setCreateError('')
                }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.clients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No clients found. Create one to get started.
                </td>
              </tr>
            ) : (
              data.clients.map((client) => (
                <tr
                  key={client.id}
                  className="bg-card transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {client.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUS_STYLES[client.status] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {client.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/super-admin/clients/$clientId"
                        params={{ clientId: client.id }}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        View
                      </Link>
                      {client.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleSuspend(client.id)}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              to="/super-admin/clients"
              search={{ page: Math.max(1, page - 1) }}
              disabled={page <= 1}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                page <= 1 && 'pointer-events-none opacity-50',
              )}
            >
              Previous
            </Link>
            <Link
              to="/super-admin/clients"
              search={{ page: Math.min(totalPages, page + 1) }}
              disabled={page >= totalPages}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                page >= totalPages && 'pointer-events-none opacity-50',
              )}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
