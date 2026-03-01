import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Lightbulb,
  Map,
  AlertCircle,
} from 'lucide-react'
import { getProducts } from '~/server/functions/products'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite } from '~/lib/permissions'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/_authed/$orgSlug/products/')({
  loader: () => getProducts(),
  component: ProductsPage,
})

function ProductsPage() {
  const products = Route.useLoaderData()
  const { orgSlug } = Route.useParams()
  const parentData = Route.useRouteContext() as { clientUserRole?: string }
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'ALL' || product.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [products, search, statusFilter])

  const userCanWrite = canWrite(parentData.clientUserRole as any)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your product portfolio ({products.length} total)
          </p>
        </div>
        {userCanWrite && (
          <Link
            to="/$orgSlug/products/new"
            params={{ orgSlug }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {products.length === 0
              ? 'No products yet'
              : 'No products match your filters'}
          </p>
          {products.length === 0 && userCanWrite && (
            <Link
              to="/$orgSlug/products/new"
              params={{ orgSlug }}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create your first product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to="/$orgSlug/products/$productId"
              params={{ orgSlug, productId: product.id }}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: product.color }}
                  />
                  <h3 className="text-base font-semibold text-card-foreground group-hover:text-accent-foreground">
                    {product.name}
                  </h3>
                </div>
                <StatusBadge status={product.status} />
              </div>

              {product.description && (
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {product._count.ideas} ideas
                </span>
                <span className="inline-flex items-center gap-1">
                  <Map className="h-3.5 w-3.5" />
                  {product._count.roadmaps} roadmaps
                </span>
                <span className="inline-flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {product._count.issues} issues
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
