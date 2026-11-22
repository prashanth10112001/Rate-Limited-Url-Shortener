import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function CopyButton({
  value,
  label = "Copy link",
  iconOnly = false,
}: {
  value: string
  label?: string
  iconOnly?: boolean
}) {
  const copyToClipboard = useCopyToClipboard()
  const accessibleLabel = label.toLowerCase().startsWith("copy ")
    ? label
    : `Copy ${label}`

  return (
    <Button
      type="button"
      size={iconOnly ? "icon" : "sm"}
      variant={iconOnly ? "ghost" : "outline"}
      aria-label={iconOnly ? accessibleLabel : undefined}
      onClick={() => void copyToClipboard(value)}
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
      {!iconOnly && label}
    </Button>
  )
}
