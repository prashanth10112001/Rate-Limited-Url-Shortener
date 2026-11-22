import { toast } from "sonner"
import { copyText } from "@/lib/utils"
import { getApiErrorMessage } from "@/api/client"

export function useCopyToClipboard() {
  return async (value: string) => {
    try {
      await copyText(value)
      toast.success("Short URL copied successfully")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }
}
