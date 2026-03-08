import { useState } from 'react'
import { Package } from 'lucide-react'
import { PRODUCT_ICONS, getProductIcon } from '~/lib/product-icons'
import { cn } from '~/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Input } from '~/components/ui/input'

export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string
  onChange: (icon: string) => void
  color?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const SelectedIcon = getProductIcon(value) ?? Package
  const filtered = search
    ? PRODUCT_ICONS.filter(
        (e) =>
          e.label.toLowerCase().includes(search.toLowerCase()) ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()),
      )
    : PRODUCT_ICONS

  const categories = [...new Set(filtered.map((e) => e.category))]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
            'transition-[color,box-shadow] outline-none hover:bg-accent/50',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'dark:bg-input/30',
          )}
        >
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: color ? `${color}20` : undefined }}
          >
            <SelectedIcon
              className="h-4 w-4"
              style={{ color: color || undefined }}
            />
          </div>
          <span className="text-foreground">
            {PRODUCT_ICONS.find((e) => e.name === value)?.label || 'Choose icon'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border/40">
          <Input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-2">
          {categories.map((cat) => {
            const items = filtered.filter((e) => e.category === cat)
            return (
              <div key={cat}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                  {cat}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {items.map((entry) => {
                    const Icon = entry.icon
                    return (
                      <button
                        key={entry.name}
                        type="button"
                        title={entry.label}
                        onClick={() => {
                          onChange(entry.name)
                          setOpen(false)
                          setSearch('')
                        }}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                          value === entry.name
                            ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No icons match "{search}"
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
