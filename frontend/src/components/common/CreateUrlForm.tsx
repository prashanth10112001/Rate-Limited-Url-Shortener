import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowUpRight, Link2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { createShortUrl } from "@/api/urls"
import { getApiErrorMessage } from "@/api/client"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/common/LoadingButton"
import { useBackendHealth } from "@/context/BackendHealthContext"
import { shortenSchema, type ShortenFormValues } from "@/lib/validation"
import type { ShortenResponse } from "@/types/api"

interface CreateUrlFormProps {
  onCreated?: (result: ShortenResponse, originalUrl: string) => void | Promise<void>
  buttonLabel?: string
}

export function CreateUrlForm({
  onCreated,
  buttonLabel = "Generate short URL",
}: CreateUrlFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShortenFormValues>({
    resolver: zodResolver(shortenSchema),
    defaultValues: { long_url: "" },
  })
  const { ensureBackendReady } = useBackendHealth()

  const submit = handleSubmit(async (values) => {
    try {
      await ensureBackendReady()
      const result = await createShortUrl({ long_url: values.long_url.trim() })
      await onCreated?.(result, values.long_url.trim())
      reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <form className="space-y-3" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor="long_url">
        Long URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Link2
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="long_url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/your-long-link"
            aria-invalid={Boolean(errors.long_url)}
            aria-describedby={errors.long_url ? "long_url_error" : undefined}
            className="h-12 pl-10"
            disabled={isSubmitting}
            {...register("long_url")}
          />
        </div>
        <LoadingButton
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Creating URL…"
          className="shrink-0"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          {buttonLabel}
        </LoadingButton>
      </div>
      {errors.long_url && (
        <p id="long_url_error" className="text-sm text-destructive" role="alert">
          {errors.long_url.message}
        </p>
      )}
    </form>
  )
}
