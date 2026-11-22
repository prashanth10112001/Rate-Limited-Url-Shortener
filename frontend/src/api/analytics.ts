import api from "@/api/client"
import type { UrlClickPage, UrlStats } from "@/types/api"

export async function getUrlStats(shortCode: string) {
  const response = await api.get<UrlStats>(
    `/api/stats/${encodeURIComponent(shortCode)}`,
  )
  return response.data
}

export async function getUrlClicks(
  shortCode: string,
  params: {
    limit?: number
    offset?: number
    search?: string
    sortBy?: string
    sortDirection?: "asc" | "desc"
  } = {},
) {
  const response = await api.get<UrlClickPage>(
    `/api/stats/${encodeURIComponent(shortCode)}/clicks`,
    {
      params: {
        limit: params.limit,
        offset: params.offset,
        search: params.search || undefined,
        sort_by: params.sortBy,
        sort_direction: params.sortDirection,
      },
    },
  )
  return response.data
}
