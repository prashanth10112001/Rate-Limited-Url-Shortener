import { LockKeyhole } from "lucide-react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { LoadingScreen } from "@/components/common/LoadingScreen"
import { StatusPage } from "@/components/common/StatusPage"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/useAuth"

export default function UnauthorizedPage() {
  const location = useLocation()
  const { user, isLoading } = useAuth()
  const state = location.state as { from?: unknown } | null
  const loginState = state?.from ? { from: state.from } : undefined

  if (isLoading) {
    return <LoadingScreen label="Restoring your session…" />
  }
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <StatusPage
      title="Access restricted"
      description="You must login to access this page."
      icon={LockKeyhole}
      actions={
        <>
          <Button asChild>
            <Link to="/login" state={loginState}>Log in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">Create an account</Link>
          </Button>
        </>
      }
    />
  )
}
