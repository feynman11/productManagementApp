import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, AlertCircle, Plus, Trash2 } from 'lucide-react'
import {
  getClient,
  updateClient,
  suspendClient,
  activateClient,
  addUserToOrg,
  removeUserFromOrg,
  updateUserOrgRole,
} from '~/server/functions/clients'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export const Route = createFileRoute('/_authed/super-admin/clients/$clientId')(
  {
    loader: ({ params }) =>
      getClient({ data: { clientId: params.clientId } }),
    component: ClientDetailPage,
  },
)

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  PENDING_SETUP: 'outline',
  SUSPENDED: 'destructive',
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CONTRIBUTOR: 'Contributor',
  VIEWER: 'Viewer',
}

function ClientDetailPage() {
  const client = Route.useLoaderData()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(client.name)
  const [slug, setSlug] = useState(client.slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false)
  const [newClerkUserId, setNewClerkUserId] = useState('')
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'>('VIEWER')
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  function reload() {
    navigate({
      to: '/super-admin/clients/$clientId',
      params: { clientId: client.id },
      search: { page: 1 },
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateClient({ data: { clientId: client.id, name, slug } })
      setEditing(false)
      reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend() {
    if (!confirm('Are you sure you want to suspend this client? All users will lose access.')) return
    try {
      await suspendClient({ data: { clientId: client.id } })
      reload()
    } catch { /* */ }
  }

  async function handleActivate() {
    try {
      await activateClient({ data: { clientId: client.id } })
      reload()
    } catch { /* */ }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setAddUserError('')
    setAddingUser(true)
    try {
      await addUserToOrg({ data: { clientId: client.id, clerkUserId: newClerkUserId, role: newUserRole } })
      setShowAddUser(false)
      setNewClerkUserId('')
      setNewUserRole('VIEWER')
      reload()
    } catch (err: unknown) {
      setAddUserError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setAddingUser(false)
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!confirm('Remove this user from the organization?')) return
    try {
      await removeUserFromOrg({ data: { clientId: client.id, userId } })
      reload()
    } catch { /* */ }
  }

  async function handleRoleChange(userId: string, role: 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER') {
    try {
      await updateUserOrgRole({ data: { clientId: client.id, userId, role } })
      reload()
    } catch { /* */ }
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
      <Link
        to="/super-admin/clients"
        search={{ page: 1 }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Clients
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {client.name}
            </h2>
            <Badge variant={STATUS_VARIANT[client.status] ?? 'secondary'}>
              {client.status.replace('_', ' ')}
            </Badge>
            {client.isDemo && <Badge variant="secondary">Demo</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            /{client.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          {client.status === 'SUSPENDED' ? (
            <Button variant="default" onClick={handleActivate}>
              Activate
            </Button>
          ) : (
            client.status !== 'INACTIVE' && (
              <Button variant="destructive" onClick={handleSuspend}>
                Suspend
              </Button>
            )
          )}
        </div>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Client</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium text-foreground">Name</label>
                  <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-slug" className="text-sm font-medium text-foreground">Slug</label>
                  <Input id="edit-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="^[a-z0-9-]+$" />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">ID</dt>
                <dd className="text-sm font-mono text-foreground">{client.id}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[client.status] ?? 'secondary'}>
                    {client.status.replace('_', ' ')}
                  </Badge>
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Demo</dt>
                <dd className="text-sm text-foreground">{client.isDemo ? 'Yes' : 'No'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="text-sm text-foreground">{formatDate(client.createdAt)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Updated</dt>
                <dd className="text-sm text-foreground">{formatDate(client.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Users ({client.clientUsers.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddUser(!showAddUser)}>
              <Plus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            {showAddUser && (
              <div className="mb-4 rounded-lg border border-border p-4">
                {addUserError && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {addUserError}
                  </div>
                )}
                <form onSubmit={handleAddUser} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Clerk User ID</label>
                    <Input
                      value={newClerkUserId}
                      onChange={(e) => setNewClerkUserId(e.target.value)}
                      required
                      placeholder="user_..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Role</label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as typeof newUserRole)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingUser}>
                      {addingUser ? 'Adding...' : 'Add'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddUser(false); setAddUserError('') }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {client.clientUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No users associated with this client yet.
              </p>
            ) : (
              <div className="space-y-3">
                {client.clientUsers.map((cu) => (
                  <div
                    key={cu.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {cu.user.name ?? cu.user.email ?? cu.user.clerkUserId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDate(cu.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={cu.role}
                        onValueChange={(v) => handleRoleChange(cu.userId, v as 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER')}
                      >
                        <SelectTrigger className="h-7 text-xs w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveUser(cu.userId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
