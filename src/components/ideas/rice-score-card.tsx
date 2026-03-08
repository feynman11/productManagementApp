import { useState } from 'react'
import { BarChart3, Pencil, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
      min: 0,
      step: 1,
      description: 'Users per quarter',
      color: 'bg-blue-500',
      maxDisplay: 100,
    },
    {
      label: 'Impact',
      value: editing ? formValues.impact : impact,
      key: 'impact' as const,
      min: 0,
      step: 1,
      description: 'Score (0-3)',
      color: 'bg-violet-500',
      maxDisplay: 3,
    },
    {
      label: 'Confidence',
      value: editing ? formValues.confidence : confidence,
      key: 'confidence' as const,
      min: 0,
      max: 1,
      step: 0.1,
      description: 'Level (0-1)',
      color: 'bg-emerald-500',
      maxDisplay: 1,
    },
    {
      label: 'Effort',
      value: editing ? formValues.effort : effort,
      key: 'effort' as const,
      min: 0,
      step: 1,
      description: 'Person-months',
      color: 'bg-amber-500',
      maxDisplay: 12,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-tint">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm">RICE Score</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums font-heading">
              {formatScore(previewScore)}
            </span>
            {editable && !editing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleStartEdit}
                aria-label="Edit RICE scores"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {editing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  onClick={handleSave}
                  disabled={saving}
                  aria-label="Save RICE scores"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditing(false)}
                  aria-label="Cancel editing"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {riceComponents.map((comp) => {
          const val = comp.value ?? 0
          const pct = Math.min(100, (val / comp.maxDisplay) * 100)

          return (
            <div key={comp.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {comp.label}
                </label>
                {editing ? (
                  <Input
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
                    className="h-7 w-20 text-xs text-right"
                  />
                ) : (
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {comp.value != null ? comp.value : '--'}
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', comp.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{comp.description}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
