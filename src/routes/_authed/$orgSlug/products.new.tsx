import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Palette, Package } from 'lucide-react'
import { createProduct } from '~/server/functions/products'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute('/_authed/$orgSlug/products/new')({
  component: NewProductPage,
})

const DEFAULT_COLORS = [
  '#6366F1',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
]

function NewProductPage() {
  const { orgSlug } = Route.useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [vision, setVision] = useState('')
  const [color, setColor] = useState('#6366F1')
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate({ to: '/$orgSlug/products', params: { orgSlug } })
          }
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="page-heading">New Product</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create a new product to manage ideas, roadmap, and issues.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 border border-border/40">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Package className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-heading">
                  {name || 'Product Name'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {description || 'Product description will appear here'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-sm font-medium text-foreground">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g., Mobile App, Platform API"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="product-desc" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Brief description of this product..."
                className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm resize-none dark:bg-input/30"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            {/* Vision */}
            <div className="space-y-2">
              <label htmlFor="product-vision" className="text-sm font-medium text-foreground">
                Vision
              </label>
              <textarea
                id="product-vision"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                rows={3}
                placeholder="What is the long-term vision for this product?"
                className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm resize-none dark:bg-input/30"
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
                        'h-8 w-8 rounded-lg border-2 transition-all duration-150',
                        color === c
                          ? 'border-foreground scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="h-8 w-24 px-2 text-xs font-mono"
                />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <label htmlFor="product-icon" className="text-sm font-medium text-foreground">
                Icon
              </label>
              <Input
                id="product-icon"
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., package, rocket, globe"
              />
              <p className="text-xs text-muted-foreground">
                Optional icon name for identification
              </p>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 pt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate({ to: '/$orgSlug/products', params: { orgSlug } })
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
