import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Plus, X, AlertCircle } from 'lucide-react'
import {
  getClients,
  createClient,
  suspendClient,
} from '~/server/functions/clients'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table'

const searchSchema = z.object({
  page: z.number().int().positive().catch(1),
})

export const Route = createFileRoute('/_authed/super-admin/clients')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => getClients({ data: { page: deps.page, limit: 20 } }),
  component: ClientsPage,
})

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  PENDING_SETUP: 'outline',
  SUSPENDED: 'destructive',
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
      // Silently fail for now
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
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all client organizations ({data.total} total)
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Create Client
        </Button>
      </div>

      {/* Create client form */}
      {showCreate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">New Client</CardTitle>
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
            <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="client-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="client-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Acme Corp"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label htmlFor="client-slug" className="text-sm font-medium text-foreground">
                  Slug
                </label>
                <Input
                  id="client-slug"
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  required
                  pattern="^[a-z0-9-]+$"
                  placeholder="acme-corp"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
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
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Clients table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No clients found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {client.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[client.status] ?? 'secondary'}>
                      {client.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/super-admin/clients/$clientId"
                        params={{ clientId: client.id }}
                        search={{ page: 1 }}
                      >
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {client.status !== 'SUSPENDED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleSuspend(client.id)}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                Previous
              </Button>
            </Link>
            <Link
              to="/super-admin/clients"
              search={{ page: Math.min(totalPages, page + 1) }}
              disabled={page >= totalPages}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
