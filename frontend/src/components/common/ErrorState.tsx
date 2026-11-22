import { CircleAlert, LoaderCircle } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function ErrorState({
  title = "We couldn’t load this content",
  description,
  onRetry,
  isRetrying = false,
  action,
}: {
  title?: string
  description: string
  onRetry?: () => void
  isRetrying?: boolean
  action?: ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center px-6 py-12 text-center"
      role="alert"
      aria-live="polite"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <CircleAlert className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button type="button" variant="outline" onClick={onRetry} disabled={isRetrying}>
            {isRetrying && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
