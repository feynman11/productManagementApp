import { useState } from 'react'
import { MessageSquare, Send, User } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {comment.authorId.slice(0, 8)}...
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'resize-none',
              )}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors',
                'hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Sending...' : 'Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
