import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Palette } from 'lucide-react'
import { createProduct } from '~/server/functions/products'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_authed/$orgSlug/products/new')({
  component: NewProductPage,
})

const DEFAULT_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
]

function NewProductPage() {
  const { orgSlug } = Route.useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [vision, setVision] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [icon, setIcon] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const product = await createProduct({
        data: {
          name,
          description: description || undefined,
          vision: vision || undefined,
          color,
          icon: icon || undefined,
        },
      })
      navigate({
        to: '/$orgSlug/products/$productId',
        params: { orgSlug, productId: product.id },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create product'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            navigate({ to: '/$orgSlug/products', params: { orgSlug } })
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            New Product
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create a new product to manage ideas, roadmap, and issues.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-border bg-card p-6"
      >
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="product-name"
            className="text-sm font-medium text-foreground"
          >
            Product Name <span className="text-destructive">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g., Mobile App, Platform API"
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="product-desc"
            className="text-sm font-medium text-foreground"
          >
            Description
          </label>
          <textarea
            id="product-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Brief description of this product..."
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
            )}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        {/* Vision */}
        <div className="space-y-2">
          <label
            htmlFor="product-vision"
            className="text-sm font-medium text-foreground"
          >
            Vision
          </label>
          <textarea
            id="product-vision"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={3}
            placeholder="What is the long-term vision for this product?"
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
            )}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Color
            </span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform',
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              className={cn(
                'flex h-8 w-24 rounded-md border border-input bg-background px-2 text-xs font-mono text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <label
            htmlFor="product-icon"
            className="text-sm font-medium text-foreground"
          >
            Icon
          </label>
          <input
            id="product-icon"
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g., package, rocket, globe"
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
          <p className="text-xs text-muted-foreground">
            Optional icon name for identification
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() =>
              navigate({ to: '/$orgSlug/products', params: { orgSlug } })
            }
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
