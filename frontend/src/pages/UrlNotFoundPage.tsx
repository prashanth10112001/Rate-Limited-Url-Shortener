import { Link2Off } from "lucide-react"
import { Link } from "react-router-dom"
import { StatusPage } from "@/components/common/StatusPage"
import { Button } from "@/components/ui/button"

export default function UrlNotFoundPage() {
  return (
    <StatusPage
      title="URL Not Found"
      description="The short URL you are trying to access does not exist."
      icon={Link2Off}
      actions={
        <>
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
          <Button asChild>
            <Link to="/#shortener">Create a new URL</Link>
          </Button>
        </>
      }
    />
  )
}
