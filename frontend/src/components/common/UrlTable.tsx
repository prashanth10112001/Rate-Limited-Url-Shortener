import { ArrowDown, ArrowUp, ArrowUpDown, Copy, ExternalLink } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { formatDate } from "@/lib/utils"
import type { UserUrl } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type UrlSortKey = "short_code" | "total_clicks" | "created_at"
export type SortDirection = "asc" | "desc"

interface UrlTableProps {
  urls: UserUrl[]
  sortKey: UrlSortKey
  sortDirection: SortDirection
  onSort: (key: UrlSortKey) => void
}

export function UrlTable({
  urls,
  sortKey,
  sortDirection,
  onSort,
}: UrlTableProps) {
  const copyToClipboard = useCopyToClipboard()
  const navigate = useNavigate()

  const openDetails = (shortCode: string) => {
    navigate(`/urls/${encodeURIComponent(shortCode)}`)
  }

  const sortButton = (label: string, key: UrlSortKey) => {
    const active = sortKey === key
    const Icon = active
      ? sortDirection === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 hover:text-foreground"
        onClick={() => onSort(key)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{sortButton("Short code", "short_code")}</TableHead>
          <TableHead>Original URL</TableHead>
          <TableHead>{sortButton("Clicks", "total_clicks")}</TableHead>
          <TableHead>{sortButton("Created", "created_at")}</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {urls.map((url) => (
          <TableRow
            key={url.short_code}
            className="cursor-pointer"
            tabIndex={0}
            aria-label={`Open details for ${url.short_code}`}
            onClick={() => openDetails(url.short_code)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault()
                openDetails(url.short_code)
              }
            }}
          >
            <TableCell>
              <Link
                to={`/urls/${encodeURIComponent(url.short_code)}`}
                className="font-mono font-semibold text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {url.short_code}
              </Link>
              {url.is_expired && (
                <Badge variant="warning" className="ml-2">
                  Expired
                </Badge>
              )}
            </TableCell>
            <TableCell className="max-w-[22rem]">
              <a
                href={url.long_url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-muted-foreground hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
                title={url.long_url}
              >
                {url.long_url}
              </a>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 font-medium">
                {url.total_clicks}
              </span>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(url.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Copy short URL for ${url.short_code}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    void copyToClipboard(url.short_url)
                  }}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  aria-label={`View ${url.short_code} details`}
                >
                  <Link to={`/urls/${encodeURIComponent(url.short_code)}`}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
