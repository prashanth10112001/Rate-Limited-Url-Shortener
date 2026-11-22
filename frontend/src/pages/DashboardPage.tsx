import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  RefreshCw,
  Scissors,
} from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/api/client"
import { getMyUrls } from "@/api/urls"
import { CopyButton } from "@/components/common/CopyButton"
import { CreateUrlForm } from "@/components/common/CreateUrlForm"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { DashboardSkeleton } from "@/components/common/SkeletonSections"
import { SearchInput } from "@/components/common/SearchInput"
import { SeoHead } from "@/components/common/SeoHead"
import {
  UrlTable,
  type SortDirection,
  type UrlSortKey,
} from "@/components/common/UrlTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/useAuth"
import { cn } from "@/lib/utils"
import type { ShortenResponse, UserUrl } from "@/types/api"

const URL_REFRESH_INTERVAL_MS = 30_000
const URLS_PER_PAGE = 10

export default function DashboardPage() {
  const { user } = useAuth()
  const [urls, setUrls] = useState<UserUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<UrlSortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [lastCreated, setLastCreated] = useState<ShortenResponse | null>(null)
  const hasLoadedUrls = useRef(false)
  const activeRequests = useRef(0)

  const loadUrls = useCallback(
    async (reason: "manual" | "background" = "background") => {
      if (activeRequests.current > 0) {
        return
      }

      activeRequests.current += 1
      if (reason === "manual") {
        setIsRefreshing(true)
      }

      try {
        const latestUrls = await getMyUrls()
        hasLoadedUrls.current = true
        setUrls((currentUrls) =>
          haveSameUrls(currentUrls, latestUrls) ? currentUrls : latestUrls,
        )
        setError(null)
        setRefreshError(null)
      } catch (loadError) {
        const message = getApiErrorMessage(loadError)
        if (hasLoadedUrls.current) {
          setRefreshError(message)
        } else {
          setError(message)
        }
      } finally {
        if (reason === "manual") {
          setIsRefreshing(false)
        }
        activeRequests.current -= 1
      }
    },
    [],
  )

  useEffect(() => {
    let active = true
    activeRequests.current += 1
    getMyUrls()
      .then((latestUrls) => {
        if (active) {
          hasLoadedUrls.current = true
          setUrls((currentUrls) =>
            haveSameUrls(currentUrls, latestUrls) ? currentUrls : latestUrls,
          )
          setError(null)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(loadError))
        }
      })
      .finally(() => {
        activeRequests.current -= 1
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadUrls()
      }
    }

    const intervalId = window.setInterval(refreshIfVisible, URL_REFRESH_INTERVAL_MS)
    document.addEventListener("visibilitychange", refreshIfVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", refreshIfVisible)
    }
  }, [loadUrls])

  const handleCreated = async (result: ShortenResponse) => {
    setLastCreated(result)
    toast.success("Short URL created successfully")
    await loadUrls()
  }

  const handleSort = (key: UrlSortKey) => {
    setPage(1)
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDirection(key === "short_code" ? "asc" : "desc")
  }

  const filteredUrls = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = urls.filter(
      (url) =>
        !normalizedQuery ||
        url.short_code.toLowerCase().includes(normalizedQuery) ||
        url.long_url.toLowerCase().includes(normalizedQuery),
    )

    return filtered.sort((left, right) => {
      const comparison =
        sortKey === "total_clicks"
          ? left.total_clicks - right.total_clicks
          : sortKey === "created_at"
            ? new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
            : left.short_code.localeCompare(right.short_code)
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [query, sortDirection, sortKey, urls])

  const pageCount = Math.max(1, Math.ceil(filteredUrls.length / URLS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const pageUrls = filteredUrls.slice(
    (currentPage - 1) * URLS_PER_PAGE,
    currentPage * URLS_PER_PAGE,
  )

  if (isLoading && urls.length === 0) {
    return <DashboardSkeleton />
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <SeoHead title="Dashboard — Linkly" noIndex />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Workspace</Badge>
            <span className="text-xs text-muted-foreground">Personal dashboard</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {user?.username}.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create and manage your short links from one place.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
          <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">{urls.length}</span>
          <span className="text-sm text-muted-foreground">
            {urls.length === 1 ? "short URL" : "short URLs"}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.7fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Scissors className="h-4 w-4" aria-hidden="true" />
              </span>
              Create a short URL
            </CardTitle>
            <CardDescription>Paste a public HTTP or HTTPS address to create a shareable link.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUrlForm onCreated={handleCreated} buttonLabel="Generate URL" />
            {lastCreated && (
              <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Your latest short URL</p>
                  <a
                    href={lastCreated.short_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-sm font-semibold text-primary hover:underline"
                  >
                    {lastCreated.short_url}
                  </a>
                </div>
                  <CopyButton value={lastCreated.short_url} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-white shadow-card">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-blue-300">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-lg font-semibold">Link activity</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Click into any short URL to see its aggregate performance and update its expiration.
              </p>
            </div>
            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-400">Tracked clicks</p>
                <p className="mt-1 font-display text-3xl font-bold">
                  {urls.reduce((total, url) => total + url.total_clicks, 0).toLocaleString()}
                </p>
              </div>
              <ExternalLink className="mb-1 h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Your URLs</CardTitle>
            <CardDescription className="mt-1">
              Search and sort your links. Click counts refresh every 30 seconds while this page is visible.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadUrls("manual")}
              disabled={isLoading || isRefreshing}
              aria-label="Refresh URL click counts"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden="true" />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <SearchInput
              value={query}
              onChange={(value) => {
                setPage(1)
                setQuery(value)
              }}
              placeholder="Search URLs…"
              className="w-full sm:max-w-xs"
            />
          </div>
        </CardHeader>
        {refreshError && (
          <CardContent className="border-b border-border/70 py-3">
            <p className="text-sm text-destructive" role="status">
              Could not refresh the latest counts: {refreshError} Showing the last loaded data.
            </p>
          </CardContent>
        )}
        {error ? (
          <CardContent className="py-8">
            <ErrorState
              title="Unable to fetch your URLs"
              description={error}
              onRetry={() => void loadUrls("manual")}
              isRetrying={isRefreshing}
            />
          </CardContent>
        ) : isLoading ? (
          <CardContent className="space-y-4 py-6" aria-label="Fetching URLs">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className={cn("h-4 w-20 animate-pulse rounded bg-muted", index > 1 && "w-24")} />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        ) : filteredUrls.length === 0 ? (
          <CardContent className="p-0">
            <EmptyState
              title={query ? "No links found" : "You haven't created any URLs yet."}
              description={
                query
                  ? "Try a different search term."
                  : "Create a short URL to start tracking visits and managing your links."
              }
              action={
                !query && (
                  <Button type="button" onClick={() => document.getElementById("long_url")?.focus()}>
                    Create your first short URL
                  </Button>
                )
              }
            />
          </CardContent>
        ) : (
          <>
            <UrlTable
              urls={pageUrls}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            {filteredUrls.length > URLS_PER_PAGE && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:flex-row">
                <span>
                  Showing {(currentPage - 1) * URLS_PER_PAGE + 1}–
                  {Math.min(currentPage * URLS_PER_PAGE, filteredUrls.length)} of{" "}
                  {filteredUrls.length} URLs
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </Button>
                  <span aria-live="polite">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === pageCount}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  )
}

function haveSameUrls(currentUrls: UserUrl[], latestUrls: UserUrl[]) {
  return currentUrls.length === latestUrls.length && currentUrls.every((url, index) => {
    const latestUrl = latestUrls[index]
    return latestUrl !== undefined &&
      url.short_code === latestUrl.short_code &&
      url.short_url === latestUrl.short_url &&
      url.long_url === latestUrl.long_url &&
      url.total_clicks === latestUrl.total_clicks &&
      url.created_at === latestUrl.created_at &&
      url.expires_at === latestUrl.expires_at &&
      url.is_expired === latestUrl.is_expired
  })
}
