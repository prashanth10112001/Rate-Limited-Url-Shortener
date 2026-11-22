import api from "@/api/client"
import type {
  ShortenRequest,
  ShortenResponse,
  UpdateExpirationRequest,
  UpdateExpirationResponse,
  UserUrl,
} from "@/types/api"

export async function createShortUrl(payload: ShortenRequest) {
  const response = await api.post<ShortenResponse>("/api/shorten", payload)
  return response.data
}

export async function getMyUrls() {
  const response = await api.get<UserUrl[]>("/api/my-urls")
  return response.data
}

export async function deleteUrl(shortCode: string) {
  const response = await api.delete<{ message: string }>(
    `/api/urls/${encodeURIComponent(shortCode)}`,
  )
  return response.data
}

export async function updateUrlExpiration(
  shortCode: string,
  payload: UpdateExpirationRequest,
) {
  const response = await api.patch<UpdateExpirationResponse>(
    `/api/urls/${encodeURIComponent(shortCode)}/expiration`,
    payload,
  )
  return response.data
}
