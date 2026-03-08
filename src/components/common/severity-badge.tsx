import { AlertTriangle, AlertCircle, Info, ArrowDown } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

interface SeverityBadgeProps {
  severity: string
  className?: string
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  CRITICAL: {
    color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    icon: AlertTriangle,
  },
  HIGH: {
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: AlertCircle,
  },
  MEDIUM: {
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: Info,
  },
  LOW: {
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    icon: ArrowDown,
  },
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.MEDIUM
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium gap-1',
        config.color,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {severity}
    </Badge>
  )
}
