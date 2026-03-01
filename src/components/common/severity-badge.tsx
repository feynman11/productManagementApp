import { cn } from '~/lib/utils'

interface SeverityBadgeProps {
  severity: string
  className?: string
}

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-700 dark:text-red-400',
  HIGH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  LOW: 'bg-green-500/10 text-green-700 dark:text-green-400',
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        SEVERITY_STYLES[severity] ?? 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
        className,
      )}
    >
      {severity}
    </span>
  )
}
