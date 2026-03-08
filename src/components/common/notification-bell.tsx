import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Lightbulb, Bug, MessageSquare, UserPlus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '~/server/functions/notifications'
import { cn } from '~/lib/utils'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'IDEA_VOTED':
    case 'IDEA_STATUS_CHANGED':
      return Lightbulb
    case 'IDEA_COMMENTED':
    case 'ISSUE_COMMENTED':
      return MessageSquare
    case 'ISSUE_ASSIGNED':
      return UserPlus
    default:
      return Bell
  }
}

function formatTimeAgo(dateStr: string | Date) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  ideaId: string | null
  issueId: string | null
  createdAt: string | Date
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Silently fail - user may not have org selected
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setLoading(true)
      try {
        const { notifications: items } = await getNotifications({ data: { limit: 20 } })
        setNotifications(items)
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead({ data: { notificationId } })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] px-1 text-[10px] leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
              aria-label="Mark all as read"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-accent/50 transition-colors',
                      !notification.read && 'bg-accent/30',
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        !notification.read && 'font-medium',
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 mt-0.5"
                        onClick={() => handleMarkAsRead(notification.id)}
                        aria-label="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
