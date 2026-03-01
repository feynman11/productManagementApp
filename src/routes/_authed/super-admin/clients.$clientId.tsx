import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getClient,
  updateClient,
  suspendClient,
} from '~/server/functions/clients'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_authed/super-admin/clients/$clientId')(
  {
    loader: ({ params }) =>
      getClient({ data: { clientId: params.clientId } }),
    component: ClientDetailPage,
  },
)

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  INACTIVE: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  PENDING_SETUP: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  SUSPENDED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT_ADMIN: 'Admin',
  CLIENT_USER: 'User',
  CLIENT_VIEWER: 'Viewer',
}

function ClientDetailPage() {
  const client = Route.useLoaderData()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(client.name)
  const [slug, setSlug] = useState(client.slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateClient({
        data: { clientId: client.id, name, slug },
      })
      setEditing(false)
      // Refresh the page data
      navigate({
        to: '/super-admin/clients/$clientId',
        params: { clientId: client.id },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update client'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend() {
    if (!confirm('Are you sure you want to suspend this client? All users will lose access.')) return
    try {
      await suspendClient({ data: { clientId: client.id } })
      navigate({
        to: '/super-admin/clients/$clientId',
        params: { clientId: client.id },
      })
    } catch {
      // Error handling will improve with toast notifications
    }
  }

  function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/super-admin/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">&larr;</span> Back to Clients
      </Link>

      {/* Client header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {client.name}
            </h2>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                STATUS_STYLES[client.status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {client.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            /{client.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {client.status !== 'SUSPENDED' && (
            <button
              onClick={handleSuspend}
              className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              Suspend Client
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            Edit Client
          </h3>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-slug" className="text-sm font-medium text-foreground">
                  Slug
                </label>
                <input
                  id="edit-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            Details
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">ID</dt>
              <dd className="text-sm font-mono text-foreground">{client.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Clerk Org ID</dt>
              <dd className="text-sm font-mono text-foreground">
                {client.clerkOrgId ?? 'Not linked'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    STATUS_STYLES[client.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {client.status.replace('_', ' ')}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="text-sm text-foreground">
                {formatDate(client.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Updated</dt>
              <dd className="text-sm text-foreground">
                {formatDate(client.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Users card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">
            Users ({client.clientUsers.length})
          </h3>
          {client.clientUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users associated with this client yet.
            </p>
          ) : (
            <div className="space-y-3">
              {client.clientUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {user.clerkUserId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
