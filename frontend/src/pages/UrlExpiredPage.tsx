import { TimerOff } from "lucide-react"
import { Link } from "react-router-dom"
import { StatusPage } from "@/components/common/StatusPage"
import { Button } from "@/components/ui/button"

export default function UrlExpiredPage() {
  return (
    <StatusPage
      title="Link Expired"
      description="This shortened link has expired and can no longer be used."
      icon={TimerOff}
      variant="warning"
      actions={
        <>
          <Button asChild>
            <Link to="/#shortener">Create a new URL</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </>
      }
    />
  )
}
