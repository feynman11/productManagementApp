import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Target,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getProductGoals, createGoal, updateGoal, deleteGoal } from '~/server/functions/goals'
import { canProductAdmin } from '~/lib/permissions'
import type { EffectiveProductRole } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'

export const Route = createFileRoute(
  '/_authed/$orgSlug/products/$productId/goals',
)({
  loader: ({ params }) => getProductGoals({ data: { productId: params.productId } }),
  component: GoalsPage,
})

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

type Goal = Awaited<ReturnType<typeof getProductGoals>>[number]

// ──────────────────────────────────────────────────────
// Goal Card
// ──────────────────────────────────────────────────────

function GoalCard({
  goal,
  productId,
  canEdit,
  index,
}: {
  goal: Goal
  productId: string
  canEdit: boolean
  index: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description ?? '')
  const [targetValue, setTargetValue] = useState(goal.targetValue?.toString() ?? '')
  const [currentValue, setCurrentValue] = useState(goal.currentValue?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const progress =
    goal.targetValue && goal.targetValue > 0 && goal.currentValue != null
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : null

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await updateGoal({
        data: {
          goalId: goal.id,
          productId,
          title,
          description: description || undefined,
          targetValue: targetValue ? parseFloat(targetValue) : null,
          currentValue: currentValue ? parseFloat(currentValue) : null,
        },
      })
      setEditing(false)
      router.invalidate()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this goal?')) return
    try {
      await deleteGoal({ data: { goalId: goal.id, productId } })
      router.invalidate()
    } catch { /* */ }
  }

  if (editing) {
    return (
      <Card
        className="p-5 space-y-3"
        style={{ animation: `dash-fade-in 0.35s ease-out ${index * 0.05}s both` }}
      >
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Target Value</label>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. 100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Current Value</label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. 45"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setEditing(false)
              setTitle(goal.title)
              setDescription(goal.description ?? '')
              setTargetValue(goal.targetValue?.toString() ?? '')
              setCurrentValue(goal.currentValue?.toString() ?? '')
            }}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button size="xs" onClick={handleSave} disabled={saving || !title.trim()}>
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="group p-5 space-y-3 transition-all duration-200 hover:border-primary/15"
      style={{ animation: `dash-fade-in 0.35s ease-out ${index * 0.05}s both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Target className="h-4 w-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-semibold text-sm text-foreground">{goal.title}</h4>
            {goal.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon-xs" onClick={() => setEditing(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn(
              'font-semibold tabular-nums',
              progress >= 100
                ? 'text-emerald-600 dark:text-emerald-400'
                : progress >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground',
            )}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress >= 100
                  ? 'bg-emerald-500'
                  : progress >= 50
                    ? 'bg-amber-500'
                    : 'bg-violet-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{goal.currentValue}</span>
            <span>{goal.targetValue}</span>
          </div>
        </div>
      )}

      {/* Values without target */}
      {progress === null && (goal.targetValue != null || goal.currentValue != null) && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {goal.currentValue != null && <span>Current: <span className="font-semibold text-foreground">{goal.currentValue}</span></span>}
          {goal.targetValue != null && <span>Target: <span className="font-semibold text-foreground">{goal.targetValue}</span></span>}
        </div>
      )}
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Add Goal Form
// ──────────────────────────────────────────────────────

function AddGoalForm({
  productId,
  onClose,
  onSuccess,
}: {
  productId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createGoal({
        data: {
          productId,
          title,
          description: description || undefined,
          targetValue: targetValue ? parseFloat(targetValue) : undefined,
          currentValue: 0,
        },
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold font-heading text-foreground">New Goal</h4>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g., Increase monthly active users"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe this goal..."
            className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Target Value</label>
          <Input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="h-8 text-sm"
            placeholder="e.g., 10000"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="xs" disabled={submitting || !title.trim()}>
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ──────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────

function GoalsPage() {
  const goals = Route.useLoaderData()
  const { productId } = Route.useParams()
  const { productRole } = Route.useRouteContext() as { productRole?: EffectiveProductRole }
  const router = useRouter()

  const canEdit = canProductAdmin(productRole ?? null)
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-violet-500" />
          <h3 className="font-heading font-semibold text-foreground">
            Goals
            {goals.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({goals.length})
              </span>
            )}
          </h3>
        </div>
        {canEdit && !showAdd && (
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Goal
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <AddGoalForm
          productId={productId}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            router.invalidate()
          }}
        />
      )}

      {/* Goals list */}
      {goals.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              productId={productId}
              canEdit={canEdit}
              index={index}
            />
          ))}
        </div>
      ) : (
        !showAdd && (
          <Card className="items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 mb-3">
              <Target className="h-6 w-6 text-violet-500" />
            </div>
            <h4 className="font-heading font-semibold text-foreground mb-1">No goals yet</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Set measurable goals to track your product's progress.
            </p>
            {canEdit && (
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Goal
              </Button>
            )}
          </Card>
        )
      )}
    </div>
  )
}
