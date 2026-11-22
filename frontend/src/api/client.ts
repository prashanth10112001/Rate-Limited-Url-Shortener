import axios from "axios"

export const TOKEN_STORAGE_KEY = "url-shortener.access-token"

let unauthorizedHandler: (() => void) | null = null

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
})

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.headers.Authorization &&
      !error.config.url?.endsWith("/auth/login")
    ) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) {
      return "Your session has expired. Please login again."
    }
    if (status === 403) {
      return "You don’t have permission to perform this action."
    }
    if (status === 404) {
      return "The requested resource could not be found."
    }
    if (status === 410) {
      return "This shortened link has expired."
    }
    if (status === 429) {
      return "Too many requests. Please wait a moment and try again."
    }
    if (status && status >= 500) {
      return "The server encountered an error. Please try again."
    }

    const detail: unknown = error.response?.data?.detail
    if (typeof detail === "string" && !/traceback|stack trace/i.test(detail)) {
      return detail
    }
    if (Array.isArray(detail)) {
      const messages = detail.map((item: unknown) => {
        if (typeof item !== "object" || item === null || !("msg" in item)) {
          return null
        }
        const message = String(item.msg)
        const location =
          "loc" in item && Array.isArray(item.loc)
            ? item.loc.slice(1).join(".")
            : ""
        return location ? `${location}: ${message}` : message
      })
      const joined = messages.filter(Boolean).join("; ")
      if (joined && !/traceback|stack trace/i.test(joined)) {
        return joined
      }
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The server took too long to respond. Please try again."
    }
    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again."
    }
    return error.message || "Something went wrong. Please try again."
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again."
}

export default api
