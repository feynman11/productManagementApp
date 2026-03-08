import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Settings, Users, Mail, Trash2, Loader2, Package, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { canAdmin } from '~/lib/permissions'
import {
  inviteUserToOrg,
  getPendingInvitations,
  revokeInvitation,
  getOrgMembers,
  getOrgProductsForInvite,
  updateOrgMemberRole,
  removeOrgMember,
} from '~/server/functions/invitations'
import type { OrgRole } from '~/generated/prisma/client/enums'

export const Route = createFileRoute('/_authed/$orgSlug/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { orgSlug } = Route.useParams()
  const { role, isDemo, clientId, isSuperAdmin } = Route.useRouteContext() as {
    role: OrgRole
    isDemo: boolean
    clientId: string
    isSuperAdmin: boolean
  }

  const isAdmin = canAdmin(role, isDemo) || isSuperAdmin

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-heading">Settings</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your organization settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="members">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab orgSlug={orgSlug} role={role} isDemo={isDemo} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="members" className="mt-6">
            <MembersTab orgSlug={orgSlug} clientId={clientId} isDemo={isDemo} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function GeneralTab({ orgSlug, role, isDemo }: { orgSlug: string; role: string; isDemo: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-tint">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Organization</CardTitle>
            <CardDescription>General organization information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Organization Slug
            </dt>
            <dd className="text-sm font-mono font-medium text-foreground">{orgSlug}</dd>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Your Role
            </dt>
            <dd>
              <Badge className="bg-primary/10 text-primary">{role}</Badge>
              {isDemo && (
                <Badge variant="secondary" className="ml-2">
                  Read-only
                </Badge>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function MembersTab({
  orgSlug,
  clientId,
  isDemo,
}: {
  orgSlug: string
  clientId: string
  isDemo: boolean
}) {
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getOrgMembers>> | null>(null)
  const [pendingInvites, setPendingInvites] = useState<
    Awaited<ReturnType<typeof getPendingInvitations>> | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)

  // Load data on mount
  useState(() => {
    loadData()
  })

  async function loadData() {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([
        getOrgMembers({ data: { slug: orgSlug } }),
        getPendingInvitations({ data: { clientId } }),
      ])
      setMembers(m)
      setPendingInvites(p)
    } catch {
      // ignore
    }
    setLoading(false)
  }

  if (loading && !members) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold">Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this organization.
          </p>
        </div>
        {!isDemo && (
          <Button onClick={() => setInviteOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite
          </Button>
        )}
      </div>

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Members ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members?.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                clientId={clientId}
                onUpdate={loadData}
              />
            ))}
            {members?.length === 0 && (
              <p className="px-6 py-4 text-sm text-muted-foreground">No members yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingInvites.map((invite) => (
                <PendingInviteRow
                  key={invite.id}
                  invite={invite}
                  clientId={clientId}
                  onRevoke={loadData}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        clientId={clientId}
        onInvited={loadData}
      />
    </div>
  )
}

function MemberRow({
  member,
  clientId,
  onUpdate,
}: {
  member: Awaited<ReturnType<typeof getOrgMembers>>[number]
  clientId: string
  onUpdate: () => void
}) {
  const [updating, setUpdating] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  async function handleRoleChange(newRole: string) {
    setUpdating(true)
    try {
      await updateOrgMemberRole({
        data: { clientId, userId: member.userId, role: newRole as 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER' },
      })
      onUpdate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role')
    }
    setUpdating(false)
  }

  async function handleRemove() {
    setUpdating(true)
    try {
      await removeOrgMember({ data: { clientId, userId: member.userId } })
      onUpdate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove member')
    }
    setUpdating(false)
    setConfirmRemove(false)
  }

  const initials = (member.name ?? member.email ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <Avatar>
          {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {member.name ?? 'Unknown'}
            {member.isSuperAdmin && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Super Admin
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={member.role} onValueChange={handleRoleChange} disabled={updating}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>

        {confirmRemove ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="destructive" onClick={handleRemove} disabled={updating}>
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmRemove(true)}
            disabled={updating}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}

function PendingInviteRow({
  invite,
  clientId,
  onRevoke,
}: {
  invite: { id: string; emailAddress: string; role: string; invitedAt: string }
  clientId: string
  onRevoke: () => void
}) {
  const [revoking, setRevoking] = useState(false)

  async function handleRevoke() {
    setRevoking(true)
    try {
      await revokeInvitation({ data: { invitationId: invite.id, clientId } })
      onRevoke()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke invitation')
    }
    setRevoking(false)
  }

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>
            <Mail className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{invite.emailAddress}</p>
          <p className="text-xs text-muted-foreground">
            Invited {new Date(invite.invitedAt).toLocaleDateString()} as{' '}
            <span className="font-medium">{invite.role}</span>
          </p>
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={handleRevoke} disabled={revoking}>
        {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke'}
      </Button>
    </div>
  )
}

type ProductAssignment = {
  productId: string
  role: 'OWNER' | 'MEMBER' | 'VIEWER'
}

type OrgProduct = Awaited<ReturnType<typeof getOrgProductsForInvite>>[number]

function InviteDialog({
  open,
  onOpenChange,
  clientId,
  onInvited,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  onInvited: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'>('VIEWER')
  const [productAssignments, setProductAssignments] = useState<ProductAssignment[]>([])
  const [orgProducts, setOrgProducts] = useState<OrgProduct[]>([])
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'added' | 'invited'; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && !productsLoaded) {
      getOrgProductsForInvite({ data: { clientId } })
        .then(setOrgProducts)
        .catch(() => {})
        .finally(() => setProductsLoaded(true))
    }
  }, [open, productsLoaded, clientId])

  const availableProducts = orgProducts.filter(
    (p) => !productAssignments.some((pa) => pa.productId === p.id),
  )

  function addProduct(productId: string) {
    if (!productId) return
    setProductAssignments((prev) => [...prev, { productId, role: 'MEMBER' }])
  }

  function removeProduct(productId: string) {
    setProductAssignments((prev) => prev.filter((pa) => pa.productId !== productId))
  }

  function updateProductRole(productId: string, newRole: 'OWNER' | 'MEMBER' | 'VIEWER') {
    setProductAssignments((prev) =>
      prev.map((pa) => (pa.productId === productId ? { ...pa, role: newRole } : pa)),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    setResult(null)

    try {
      const res = await inviteUserToOrg({
        data: {
          clientId,
          emailAddress: email,
          role,
          products: productAssignments,
        },
      })
      setResult(res)
      setEmail('')
      setProductAssignments([])
      onInvited()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    }
    setSending(false)
  }

  function handleClose(open: boolean) {
    if (!open) {
      setEmail('')
      setError(null)
      setResult(null)
      setProductAssignments([])
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a Member</DialogTitle>
          <DialogDescription>
            Send an invitation email. New users will be prompted to create an account and will
            automatically join this organization with the assigned role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Organization Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'ADMIN' && 'Full access including member management.'}
              {role === 'CONTRIBUTOR' && 'Can create and edit content.'}
              {role === 'VIEWER' && 'Read-only access to all content.'}
            </p>
          </div>

          {/* Product Assignments */}
          <div className="space-y-2">
            <Label>Products</Label>
            <p className="text-xs text-muted-foreground">
              Optionally add this user to specific products with a role.
            </p>

            {productAssignments.length > 0 && (
              <div className="space-y-2">
                {productAssignments.map((pa) => {
                  const product = orgProducts.find((p) => p.id === pa.productId)
                  return (
                    <div
                      key={pa.productId}
                      className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">
                        {product?.name ?? pa.productId}
                      </span>
                      <Select
                        value={pa.role}
                        onValueChange={(v) =>
                          updateProductRole(pa.productId, v as 'OWNER' | 'MEMBER' | 'VIEWER')
                        }
                      >
                        <SelectTrigger size="sm" className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => removeProduct(pa.productId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {availableProducts.length > 0 && (
              <Select value="" onValueChange={addProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add to a product..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {orgProducts.length === 0 && productsLoaded && (
              <p className="text-xs text-muted-foreground italic">
                No products in this organization yet.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {result.type === 'added'
                ? `${result.email} has been added to the organization.`
                : `Invitation sent to ${result.email}.`}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
            <Button type="submit" disabled={sending || !email}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
