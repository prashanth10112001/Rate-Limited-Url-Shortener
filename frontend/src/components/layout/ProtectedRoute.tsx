import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/useAuth"
import { useBackendHealth } from "@/context/BackendHealthContext"
import { useEffect } from "react"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingScreen } from "@/components/common/LoadingScreen"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, token, isLoading, isLoggingOut } = useAuth()
  const { status, ensureBackendReady } = useBackendHealth()
  const location = useLocation()

  useEffect(() => {
    if (!user || isLoading || status === "ready") {
      return
    }

    void ensureBackendReady().catch(() => undefined)
  }, [ensureBackendReady, isLoading, status, user])

  if (isLoggingOut) {
    return <LoadingScreen label="Logging out..." />
  }

  if (token && status !== "ready") {
    if (status === "error") {
      return (
        <ErrorState
          title="Services are taking longer than expected"
          description="Starting services, this may take a few seconds. Check your connection and retry."
          onRetry={() => {
            void ensureBackendReady().catch(() => undefined)
          }}
        />
      )
    }
    return <LoadingScreen label="Starting services, this may take a few seconds…" />
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />
  }

  return children
}
