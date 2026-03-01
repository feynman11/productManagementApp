import { useState } from 'react'
import { BarChart3, Pencil, Check, X } from 'lucide-react'
import { cn } from '~/lib/utils'

interface RiceScoreCardProps {
  reach: number | null
  impact: number | null
  confidence: number | null
  effort: number | null
  score: number | null
  editable: boolean
  onSave?: (values: {
    riceReach: number
    riceImpact: number
    riceConfidence: number
    riceEffort: number
  }) => Promise<void>
}

function calculateRiceScore(
  reach: number,
  impact: number,
  confidence: number,
  effort: number,
): number | null {
  if (effort === 0) return null
  return (reach * impact * confidence) / effort
}

function formatScore(score: number | null): string {
  if (score == null) return '--'
  return score.toFixed(1)
}

export function RiceScoreCard({
  reach,
  impact,
  confidence,
  effort,
  score,
  editable,
  onSave,
}: RiceScoreCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState({
    reach: reach ?? 0,
    impact: impact ?? 0,
    confidence: confidence ?? 0.5,
    effort: effort ?? 1,
  })

  function handleStartEdit() {
    setFormValues({
      reach: reach ?? 0,
      impact: impact ?? 0,
      confidence: confidence ?? 0.5,
      effort: effort ?? 1,
    })
    setEditing(true)
  }

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({
        riceReach: formValues.reach,
        riceImpact: formValues.impact,
        riceConfidence: formValues.confidence,
        riceEffort: formValues.effort,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const previewScore = editing
    ? calculateRiceScore(
        formValues.reach,
        formValues.impact,
        formValues.confidence,
        formValues.effort,
      )
    : score

  const riceComponents = [
    {
      label: 'Reach',
      value: editing ? formValues.reach : reach,
      key: 'reach' as const,
      type: 'number' as const,
      min: 0,
      step: 1,
      description: 'Users affected per quarter',
    },
    {
      label: 'Impact',
      value: editing ? formValues.impact : impact,
      key: 'impact' as const,
      type: 'number' as const,
      min: 0,
      step: 1,
      description: 'Impact score (0-3)',
    },
    {
      label: 'Confidence',
      value: editing ? formValues.confidence : confidence,
      key: 'confidence' as const,
      type: 'number' as const,
      min: 0,
      max: 1,
      step: 0.1,
      description: 'Confidence (0-1)',
    },
    {
      label: 'Effort',
      value: editing ? formValues.effort : effort,
      key: 'effort' as const,
      type: 'number' as const,
      min: 0,
      step: 1,
      description: 'Person-months',
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">RICE Score</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatScore(previewScore)}
          </span>
          {editable && !editing && (
            <button
              onClick={handleStartEdit}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Edit RICE scores"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {editing && (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-500/10 disabled:opacity-50 dark:text-green-400"
                aria-label="Save RICE scores"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Cancel editing"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {riceComponents.map((comp) => (
          <div key={comp.key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {comp.label}
            </label>
            {editing ? (
              <input
                type="number"
                value={comp.value ?? 0}
                min={comp.min}
                max={comp.max}
                step={comp.step}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    [comp.key]: parseFloat(e.target.value) || 0,
                  }))
                }
                className={cn(
                  'flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {comp.value != null ? comp.value : '--'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{comp.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
