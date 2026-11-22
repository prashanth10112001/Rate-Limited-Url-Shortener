import { LoaderCircle } from "lucide-react"

export function LoadingScreen({ label = "Loading your workspace…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
