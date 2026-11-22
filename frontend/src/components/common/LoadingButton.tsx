import { LoaderCircle } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  ...props
}: ComponentProps<typeof Button> & {
  isLoading: boolean
  loadingText: string
  children: ReactNode
}) {
  return (
    <Button {...props} disabled={isLoading || props.disabled}>
      {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {isLoading ? loadingText : children}
    </Button>
  )
}
