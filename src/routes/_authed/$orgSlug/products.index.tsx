import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Lightbulb,
  Layers,
  AlertCircle,
  ArrowRight,
  Download,
} from 'lucide-react'
import { getProducts } from '~/server/functions/products'
import { exportProductsCsv } from '~/server/functions/export'
import { downloadFile } from '~/lib/download'
import { StatusBadge } from '~/components/common/status-badge'
import { canWrite } from '~/lib/permissions'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'

export const Route = createFileRoute('/_authed/$orgSlug/products/')({
  loader: () => getProducts(),
  component: ProductsPage,
})

function ProductsPage() {
  const products = Route.useLoaderData()
  const { orgSlug } = Route.useParams()
  const { role, isDemo } = Route.useRouteContext() as { role?: string; isDemo?: boolean }
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

  const userCanWrite = canWrite(role as any, isDemo)

  async function handleExportCsv() {
    try {
      const result = await exportProductsCsv()
      downloadFile(result.csv, result.filename)
    } catch {
      // silent fail — could enhance with toast
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-heading">Products</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your product portfolio ({products.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                Download CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {userCanWrite && (
            <Button asChild>
              <Link
                to="/$orgSlug/products/new"
                params={{ orgSlug }}
              >
                <Plus className="h-4 w-4" />
                New Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {products.length === 0
              ? 'No products yet'
              : 'No products match your filters'}
          </p>
          {products.length === 0 && userCanWrite && (
            <Button asChild size="sm" className="mt-5">
              <Link
                to="/$orgSlug/products/new"
                params={{ orgSlug }}
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first product
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to="/$orgSlug/products/$productId"
              params={{ orgSlug, productId: product.id }}
            >
              <Card className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md py-0">
                {/* Color accent bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                  style={{ backgroundColor: product.color }}
                />

                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between pl-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${product.color}15` }}
                      >
                        <Package className="h-4 w-4" style={{ color: product.color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors font-heading">
                          {product.name}
                        </h3>
                        <StatusBadge status={product.status} className="mt-1" />
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>

                  {product.description && (
                    <p className="mb-4 pl-2 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pl-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500/70" />
                      {product._count.ideas}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-500/70" />
                      {product.activeFeatureCount}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500/70" />
                      {product._count.issues}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
