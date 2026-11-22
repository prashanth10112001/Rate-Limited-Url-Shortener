export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  username: string
  email: string
}

export interface ShortenRequest {
  long_url: string
}

export interface ShortenResponse {
  message: string
  short_code: string
  short_url: string
}

export interface UserUrl {
  short_code: string
  short_url: string
  long_url: string
  total_clicks: number
  created_at: string
  expires_at: string | null
  is_expired: boolean
}

export interface UrlStats {
  short_code: string
  short_url: string
  total_clicks: number
  last_click_at?: string | null
  unique_visitors?: number | null
}

export interface UrlClickRecord {
  [field: string]: string | number | null
}

export interface UrlClickPage {
  items: UrlClickRecord[]
  total: number
  limit: number
  offset: number
}

export interface UpdateExpirationRequest {
  expires_at: string | null
}

export interface UpdateExpirationResponse {
  message: string
  expires_at: string | null
}
