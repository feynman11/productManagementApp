import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { Button } from '~/components/ui/button'
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
    <Button
      variant={hasVoted ? 'default' : 'outline'}
      size="sm"
      onClick={handleVote}
      disabled={!canVote || voting || hasVoted}
      className={cn(
        'gap-2',
        hasVoted && 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15',
      )}
      aria-label={`Upvote (${localVotes} votes)`}
    >
      <ThumbsUp
        className={cn(
          'h-4 w-4 transition-all duration-200',
          hasVoted && 'fill-primary scale-110',
        )}
      />
      <span className="font-semibold tabular-nums">{localVotes}</span>
    </Button>
  )
}
