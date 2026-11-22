import { Compass } from "lucide-react"
import { Link } from "react-router-dom"
import { LoadingScreen } from "@/components/common/LoadingScreen"
import { StatusPage } from "@/components/common/StatusPage"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/useAuth"

export default function NotFoundPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen label="Restoring your session…" />
  }

  return (
    <StatusPage
      code="404"
      title="Page Not Found"
      description="The page you're looking for doesn't exist or may have been moved."
      icon={Compass}
      actions={
        <>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
          {user && (
            <Button asChild variant="outline">
              <Link to="/dashboard">Go Dashboard</Link>
            </Button>
          )}
        </>
      }
    />
  )
}
