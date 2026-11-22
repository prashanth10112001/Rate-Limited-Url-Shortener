import axios from "axios"
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import {
  BackendHealthContext,
  type BackendHealthStatus,
} from "@/context/BackendHealthContext"

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/"
const HEALTH_URL = `${API_BASE_URL.replace(/\/$/, "")}/health`

export function BackendHealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackendHealthStatus>("idle")
  const inFlight = useRef<Promise<void> | null>(null)
  const statusRef = useRef<BackendHealthStatus>("idle")
  const updateStatus = useCallback((nextStatus: BackendHealthStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])
  const ensureBackendReady = useCallback(() => {
    if (statusRef.current === "ready") {
      return Promise.resolve()
    }
    if (inFlight.current) {
      return inFlight.current
    }

    updateStatus("checking")
    const request = axios
      .get(HEALTH_URL, { timeout: 90_000 })
      .then(() => {
        updateStatus("ready")
      })
      .catch((error: unknown) => {
        updateStatus("error")
        throw error
      })
      .finally(() => {
        inFlight.current = null
      })
    inFlight.current = request
    return request
  }, [updateStatus])

  const value = useMemo(
    () => ({ status, ensureBackendReady }),
    [ensureBackendReady, status],
  )

  return (
    <BackendHealthContext.Provider value={value}>
      {children}
    </BackendHealthContext.Provider>
  )
}
