import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { getUrlClicks } from "@/api/analytics"
import { getApiErrorMessage } from "@/api/client"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { SearchInput } from "@/components/common/SearchInput"
import { SkeletonTable } from "@/components/common/SkeletonSections"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UrlClickRecord } from "@/types/api"

const ROWS_PER_PAGE = 10

function formatColumnName(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCellValue(value: string | number | null) {
  if (value === null || value === "") {
    return "—"
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString()
    }
  }
  return String(value)
}

export function AnalyticsTable({ shortCode }: { shortCode: string }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("clicked_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<UrlClickRecord[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const columns = useMemo(
    () => [...new Set(records.flatMap((record) => Object.keys(record)))],
    [records],
  )
  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)
      getUrlClicks(shortCode, {
        limit: ROWS_PER_PAGE,
        offset: (page - 1) * ROWS_PER_PAGE,
        search: query.trim(),
        sortBy: sortKey,
        sortDirection,
      })
        .then((result) => {
          if (active) {
            setRecords(result.items)
            setTotal(result.total)
            const lastPage = Math.max(1, Math.ceil(result.total / ROWS_PER_PAGE))
            if (page > lastPage) {
              setPage(lastPage)
            }
          }
        })
        .catch((requestError: unknown) => {
          if (active) {
            setError(getApiErrorMessage(requestError))
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false)
          }
        })
    }, query ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [page, query, retryCount, shortCode, sortDirection, sortKey])

  if (error) {
    return (
      <ErrorState
        title="Unable to load click records"
        description={error}
        onRetry={() => setRetryCount((count) => count + 1)}
      />
    )
  }

  const pageCount = Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)

  const toggleSort = (column: string) => {
    setPage(1)
    if (sortKey === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(column)
      setSortDirection("desc")
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total} {total === 1 ? "click" : "clicks"}
        </p>
        <SearchInput
          value={query}
          onChange={(value) => {
            setPage(1)
            setQuery(value)
          }}
          placeholder="Search click records"
          className="w-full sm:max-w-xs"
        />
      </div>
      {isLoading ? (
        <SkeletonTable rows={5} columns={Math.max(columns.length, 4)} />
      ) : total === 0 ? (
        <EmptyState
          title={query ? "No matching clicks" : "No clicks recorded yet"}
          description={
            query
              ? "Try a different search term."
              : "When someone visits this short link, the click details will appear here."
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => {
                  const SortIcon =
                    sortKey === column
                      ? sortDirection === "asc"
                        ? ArrowUp
                        : ArrowDown
                      : ArrowUpDown
                  return (
                    <TableHead key={column}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-foreground"
                        onClick={() => toggleSort(column)}
                        aria-label={`Sort by ${formatColumnName(column)}`}
                      >
                        {formatColumnName(column)}
                        <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, rowIndex) => (
                <TableRow key={`${String(record.id ?? "click")}-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      className="max-w-72 whitespace-normal break-words"
                    >
                      {formatCellValue(record[column] ?? null)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {total > ROWS_PER_PAGE && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:flex-row">
              <span>
                Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(currentPage * ROWS_PER_PAGE, total)} of {total} clicks
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous click page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </Button>
                <span aria-live="polite">Page {currentPage} of {pageCount}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  aria-label="Next click page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
