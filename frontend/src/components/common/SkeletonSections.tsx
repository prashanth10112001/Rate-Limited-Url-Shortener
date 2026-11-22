import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <section className="container-page space-y-8 py-10 sm:py-14" aria-label="Loading dashboard" role="status">
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SkeletonCard className="min-h-56" />
        <SkeletonCard className="min-h-56" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/70 p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-56 max-w-[45%]" />
        </div>
        <SkeletonTable />
      </div>
    </section>
  )
}

export function UrlDetailsSkeleton() {
  return (
    <section className="container-page space-y-6 py-10 sm:py-14" aria-label="Loading URL details" role="status">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} className="min-h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard className="min-h-56" />
        <SkeletonCard className="min-h-56" />
      </div>
    </section>
  )
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-5 ${className}`}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-5 h-8 w-2/3" />
      <Skeleton className="mt-3 h-3 w-full" />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-4 p-5" aria-label="Loading table" role="status">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={`h-4 ${column === 0 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
