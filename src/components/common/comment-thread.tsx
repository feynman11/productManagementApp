import { useState } from 'react'
import { MessageSquare, Send, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface Comment {
  id: string
  content: string
  authorId: string
  createdAt: string | Date
}

interface CommentThreadProps {
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
  canComment: boolean
}

function formatRelativeDate(dateStr: string | Date) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getAvatarColor(authorId: string) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-fuchsia-500',
  ]
  let hash = 0
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function CommentThread({
  comments,
  onAddComment,
  canComment,
}: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError('')
    setSubmitting(true)
    try {
      await onAddComment(content.trim())
      setContent('')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add comment'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground font-heading">
          Comments
        </h3>
        <Badge variant="secondary" className="text-[11px]">
          {comments.length}
        </Badge>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-medium',
                getAvatarColor(comment.authorId),
              )}>
                {comment.authorId.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {comment.authorId.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(comment.createdAt)}
                  </span>
                </div>
                <Card>
                  <CardContent className="px-3.5 py-2.5">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !content.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? 'Sending...' : 'Comment'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
