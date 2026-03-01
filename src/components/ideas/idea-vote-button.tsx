import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IdeaVoteButtonProps {
  votes: number
  onVote: () => Promise<void>
  canVote: boolean
}

export function IdeaVoteButton({ votes, onVote, canVote }: IdeaVoteButtonProps) {
  const [voting, setVoting] = useState(false)
  const [localVotes, setLocalVotes] = useState(votes)
  const [hasVoted, setHasVoted] = useState(false)

  async function handleVote() {
    if (!canVote || voting) return
    setVoting(true)
    try {
      await onVote()
      setLocalVotes((prev) => prev + 1)
      setHasVoted(true)
    } finally {
      setVoting(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={!canVote || voting || hasVoted}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
        hasVoted
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
          : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
        (!canVote || hasVoted) && 'cursor-default',
        voting && 'opacity-50',
      )}
      aria-label={`Upvote (${localVotes} votes)`}
    >
      <ThumbsUp
        className={cn(
          'h-4 w-4',
          hasVoted
            ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
            : 'text-muted-foreground',
        )}
      />
      <span className="font-semibold tabular-nums">{localVotes}</span>
    </button>
  )
}
