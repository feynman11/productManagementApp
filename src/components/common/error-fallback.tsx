import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
            {resetErrorBoundary && (
              <Button onClick={resetErrorBoundary} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
