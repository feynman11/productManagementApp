import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_VARIANT_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  COMPLETED: 'default',
  RELEASED: 'default',
  RESOLVED: 'default',
  CLOSED: 'secondary',
  DRAFT: 'outline',
  PLANNED: 'outline',
  BACKLOG: 'outline',
  SUBMITTED: 'outline',
  UNDER_REVIEW: 'outline',
  IN_PROGRESS: 'secondary',
  CRITICAL: 'destructive',
  OPEN: 'destructive',
  ARCHIVED: 'secondary',
  CANCELLED: 'secondary',
  SUSPENDED: 'destructive',
  WONT_FIX: 'secondary',
  REJECTED: 'secondary',
  CONVERTED: 'default',
  DUPLICATE: 'secondary',
  PENDING_SETUP: 'outline',
  INACTIVE: 'secondary',
}

const STATUS_COLOR_MAP: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  RELEASED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  PLANNED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  BACKLOG: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  CONVERTED: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  OPEN: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  CRITICAL: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'secondary'
  const colorClass = STATUS_COLOR_MAP[status]
  const label = status.replace(/_/g, ' ')

  return (
    <Badge
      variant={variant}
      className={cn(
        'text-[11px] font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </Badge>
  )
}
