import { cn } from '~/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const STATUS_VARIANT_MAP: Record<string, StatusBadgeProps['variant']> = {
  // Success / green
  ACTIVE: 'success',
  COMPLETED: 'success',
  RELEASED: 'success',
  RESOLVED: 'success',
  CLOSED: 'success',
  // Info / blue
  DRAFT: 'info',
  PLANNED: 'info',
  BACKLOG: 'info',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'info',
  // Warning / amber
  IN_PROGRESS: 'warning',
  // Danger / red
  CRITICAL: 'danger',
  OPEN: 'danger',
  // Default / gray
  ARCHIVED: 'default',
  CANCELLED: 'default',
  SUSPENDED: 'default',
  WONT_FIX: 'default',
  REJECTED: 'default',
  DUPLICATE: 'default',
}

const VARIANT_STYLES: Record<string, string> = {
  default: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  success: 'bg-green-500/10 text-green-700 dark:text-green-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant ?? STATUS_VARIANT_MAP[status] ?? 'default'
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[resolvedVariant],
        className,
      )}
    >
      {label}
    </span>
  )
}
