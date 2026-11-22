import { createContext, useContext } from "react"

export type BackendHealthStatus = "idle" | "checking" | "ready" | "error"

export interface BackendHealthContextValue {
  status: BackendHealthStatus
  ensureBackendReady: () => Promise<void>
}

export const BackendHealthContext =
  createContext<BackendHealthContextValue | null>(null)

export function useBackendHealth() {
  const context = useContext(BackendHealthContext)
  if (!context) {
    throw new Error("useBackendHealth must be used within a BackendHealthProvider")
  }
  return context
}
