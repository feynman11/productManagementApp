import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '~/components/theme-provider'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9', className)}
      onClick={cycleTheme}
      title={`Current theme: ${theme}. Click to cycle.`}
      aria-label={`Toggle theme (current: ${theme})`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
    </Button>
  )
}
