import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { PageContainer, PageHeader } from "@/components/common/PageLayout"
import { SeoHead } from "@/components/common/SeoHead"

export function StatusPage({
  code,
  title,
  description,
  icon: Icon,
  variant = "default",
  actions,
}: {
  code?: string
  title: string
  description: string
  icon: LucideIcon
  variant?: "default" | "warning" | "danger"
  actions: ReactNode
}) {
  const iconClass = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }[variant]

  return (
    <PageContainer className="flex min-h-[55vh] items-center justify-center">
      <SeoHead title={`${title} — Linkly`} noIndex />
      <div className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card px-6 py-10 text-center shadow-card sm:px-12 sm:py-14">
        <div className="relative mx-auto mb-7 grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 rounded-[2rem] border border-border/70 bg-muted/50 rotate-6" />
          <span className={`relative grid h-16 w-16 place-items-center rounded-2xl ${iconClass}`}>
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
        </div>
        {code && (
          <p className="font-mono text-sm font-semibold tracking-[0.3em] text-primary">
            {code}
          </p>
        )}
        <PageHeader title={title} description={description} className={code ? "mt-1" : ""} />
        <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </PageContainer>
  )
}
