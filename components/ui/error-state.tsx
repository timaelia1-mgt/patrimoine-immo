'use client'

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | string
  onRetry?: () => void
  retryText?: string
  showRetry?: boolean
  className?: string
}

/**
 * Professional error state display with optional retry
 *
 * @example
 * <ErrorState
 *   title="Failed to load data"
 *   message="Could not connect to the server"
 *   onRetry={() => refetch()}
 * />
 */
export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Veuillez réessayer.",
  error,
  onRetry,
  retryText = "Réessayer",
  showRetry = true,
  className,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Card className={cn("border-0", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 rounded-full bg-red-500/10 p-3">
          <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>

        <p className="mb-4 text-sm text-[var(--color-text-secondary)] max-w-md">
          {message}
        </p>

        {errorMessage && (
          <p className="mb-4 text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-tertiary)] px-3 py-2 rounded-lg max-w-md break-words">
            {errorMessage}
          </p>
        )}

        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
