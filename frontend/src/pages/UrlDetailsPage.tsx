import { useEffect, useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  Eye,
  Link2,
  Users,
  LoaderCircle,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { ReactNode } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { getUrlStats } from "@/api/analytics"
import { getApiErrorMessage } from "@/api/client"
import { deleteUrl, getMyUrls, updateUrlExpiration } from "@/api/urls"
import { AnalyticsTable } from "@/components/common/AnalyticsTable"
import { CopyButton } from "@/components/common/CopyButton"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingButton } from "@/components/common/LoadingButton"
import { UrlDetailsSkeleton } from "@/components/common/SkeletonSections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate, toLocalDateTimeValue } from "@/lib/utils"
import UrlExpiredPage from "@/pages/UrlExpiredPage"
import UrlNotFoundPage from "@/pages/UrlNotFoundPage"
import type { UrlStats, UserUrl } from "@/types/api"
import { SeoHead } from "@/components/common/SeoHead"

const expirationSchema = z.object({
  expires_at: z.string(),
})

type ExpirationFormValues = z.infer<typeof expirationSchema>

interface UrlDetails {
  stats: UrlStats
  url: UserUrl
}

export default function UrlDetailsPage() {
  const { shortCode = "" } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [details, setDetails] = useState<UrlDetails | null>(null)
  const [loadedCode, setLoadedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [failureKind, setFailureKind] = useState<"not-found" | "expired" | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ExpirationFormValues>({
    resolver: zodResolver(expirationSchema),
    defaultValues: { expires_at: "" },
  })
  const loading = loadedCode !== shortCode

  useEffect(() => {
    let active = true
    Promise.all([getUrlStats(shortCode), getMyUrls()])
      .then(([stats, urls]) => {
        if (!active) {
          return
        }
        setError(null)
        setFailureKind(null)
        const url = urls.find((item) => item.short_code === shortCode)
        if (!url) {
          setFailureKind("not-found")
          return
        }
        setDetails({ stats, url })
        reset({ expires_at: toLocalDateTimeValue(url.expires_at) })
      })
      .catch((requestError: unknown) => {
        if (active) {
          if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
            setError(null)
            setFailureKind("not-found")
          } else if (axios.isAxiosError(requestError) && requestError.response?.status === 410) {
            setError(null)
            setFailureKind("expired")
          } else {
            setFailureKind(null)
            setError(getApiErrorMessage(requestError))
          }
        }
      })
      .finally(() => {
        if (active) {
          setLoadedCode(shortCode)
        }
      })
    return () => {
      active = false
    }
  }, [reset, retryCount, shortCode])

  const saveExpiration = handleSubmit(async (values) => {
    try {
      await updateUrlExpiration(shortCode, {
        expires_at: values.expires_at
          ? new Date(values.expires_at).toISOString()
          : null,
      })
      const [stats, urls] = await Promise.all([getUrlStats(shortCode), getMyUrls()])
      const url = urls.find((item) => item.short_code === shortCode)
      if (!url) {
        throw new Error("The updated URL could not be found in your workspace.")
      }
      setDetails({ stats, url })
      reset({ expires_at: toLocalDateTimeValue(url.expires_at) })
      toast.success("Expiration updated successfully")
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError))
    }
  })

  const removeUrl = async () => {
    setIsDeleting(true)
    try {
      await deleteUrl(shortCode)
      toast.success("Short URL deleted")
      navigate("/dashboard", { replace: true })
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <UrlDetailsSkeleton />
  }

  if (failureKind === "not-found") {
    return <UrlNotFoundPage />
  }

  if (failureKind === "expired") {
    return <UrlExpiredPage />
  }

  if (error || !details) {
    return (
      <section className="container-page py-12">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <Card className="mt-6">
          <ErrorState
            title="Unable to load URL details"
            description={error || "Something went wrong while loading this URL."}
            onRetry={() => {
              setLoadedCode(null)
              setRetryCount((count) => count + 1)
            }}
          />
        </Card>
      </section>
    )
  }

  const { stats, url } = details

  return (
    <section className="container-page py-10 sm:py-14">
      <SeoHead
        title={`Analytics for ${stats.short_code}`}
        description={`Click analytics and link settings for ${url.long_url}`}
        canonicalPath={`/urls/${encodeURIComponent(shortCode)}`}
      />
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={url.is_expired ? "warning" : "success"}>
              {url.is_expired ? "Expired" : "Active"}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{url.short_code}</span>
          </div>
          <h1 className="mt-3 break-all font-display text-3xl font-bold tracking-tight">
            URL details
          </h1>
          <p className="mt-2 max-w-2xl break-all text-sm text-muted-foreground">{url.long_url}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <CopyButton value={stats.short_url} label="Copy short URL" />
          <Button asChild variant="outline">
            <a href={stats.short_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open link
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SummaryCard
          icon={<Eye className="h-4 w-4" aria-hidden="true" />}
          label="Total clicks"
          value={stats.total_clicks.toLocaleString()}
          detail="All recorded visits"
        />
        <SummaryCard
          icon={<Link2 className="h-4 w-4" aria-hidden="true" />}
          label="Short URL"
          value={stats.short_url}
          detail={stats.short_url}
          mono
          truncate
        />
        <SummaryCard
          icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
          label="Original URL"
          value={url.long_url}
          detail="Destination"
          truncate
        />
        <SummaryCard
          icon={<Check className="h-4 w-4" aria-hidden="true" />}
          label="Status"
          value={url.is_expired ? "Expired" : "Active"}
          detail={url.expires_at ? `Expires ${formatDate(url.expires_at)}` : "No expiration set"}
          status={url.is_expired ? "warning" : "success"}
        />
        <SummaryCard
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label="Created"
          value={formatDate(url.created_at)}
          detail="Created date"
        />
        {stats.last_click_at && (
          <SummaryCard
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            label="Last click"
            value={formatDate(stats.last_click_at)}
            detail={new Date(stats.last_click_at).toLocaleTimeString()}
          />
        )}
        {stats.unique_visitors !== null && stats.unique_visitors !== undefined && (
          <SummaryCard
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            label="Unique visitors"
            value={stats.unique_visitors.toLocaleString()}
            detail="Distinct IP addresses"
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.68fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Click analytics</CardTitle>
            <CardDescription>
              Click records provided by the backend, including visitor and referral details where available.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AnalyticsTable shortCode={shortCode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiration</CardTitle>
            <CardDescription>Choose when this short URL should stop redirecting. Leave blank for no expiry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={saveExpiration}>
              <label htmlFor="expires_at" className="text-sm font-medium">Expires at</label>
              <Input id="expires_at" type="datetime-local" {...register("expires_at")} />
              <LoadingButton
                type="submit"
                variant="outline"
                isLoading={isSubmitting}
                loadingText="Saving…"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Save expiration
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-destructive/15">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold">Delete this short URL</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The link and its stored click count will be permanently removed.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void removeUrl()}>
                {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isDeleting ? "Deleting…" : "Confirm delete"}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete URL
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  mono = false,
  truncate = false,
  status,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  mono?: boolean
  truncate?: boolean
  status?: "success" | "warning"
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={status === "success" ? "text-success" : status === "warning" ? "text-warning" : "text-primary"}>{icon}</span>
        </div>
        <p
          className={[
            "mt-4 font-display font-semibold text-foreground",
            mono ? "font-mono text-base sm:text-lg" : "text-xl",
            status === "success" ? "text-success" : status === "warning" ? "text-warning" : "",
            truncate ? "truncate" : "break-all",
          ].join(" ")}
          title={value}
        >
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p>
      </CardContent>
    </Card>
  )
}
