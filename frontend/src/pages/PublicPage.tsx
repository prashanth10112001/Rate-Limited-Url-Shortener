import { useState } from "react"
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  Gauge,
  Link2,
  LockKeyhole,
  MousePointer2,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { CreateUrlForm } from "@/components/common/CreateUrlForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CopyButton } from "@/components/common/CopyButton"
import { SeoHead } from "@/components/common/SeoHead"
import type { ShortenResponse } from "@/types/api"

const features = [
  {
    icon: Link2,
    title: "Shorten in seconds",
    description: "Turn long, unwieldy links into clean URLs that are ready to share.",
  },
  {
    icon: BarChart3,
    title: "Useful click analytics",
    description: "See how many times your links are visited from your private dashboard.",
  },
  {
    icon: Gauge,
    title: "Built-in rate limiting",
    description: "A token-bucket limiter helps protect the service from request bursts.",
  },
  {
    icon: LockKeyhole,
    title: "Your links, your workspace",
    description: "Sign in to manage your URLs, update expiry, and keep links in one place.",
  },
]

export default function PublicPage() {
  const [result, setResult] = useState<{
    response: ShortenResponse
    originalUrl: string
  } | null>(null)

  const handleCreated = (response: ShortenResponse, originalUrl: string) => {
    setResult({ response, originalUrl })
    toast.success("Short URL created successfully")
  }

  return (
    <>
      <SeoHead
        title="Linkly — Shorten URLs instantly"
        description="Create clean short URLs, share them instantly, and track clicks with Linkly."
        canonicalPath="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Linkly",
          applicationCategory: "BusinessApplication",
          description:
            "Create clean short URLs, manage links, and view click analytics.",
        }}
      />
      <section className="relative isolate overflow-hidden border-b border-border/70 bg-grid">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-28 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-24 top-52 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        </div>
        <div className="container-page grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              A simpler way to share links
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
              Shorten URLs <span className="text-gradient">instantly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Make every link easier to share. Get fast redirects, click tracking,
              built-in rate limiting, and secure URL management in one calm workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="shadow-glow">
                <a href="#shortener">
                  Create a short URL <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Explore features <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                No account needed to start
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                Free, instant redirects
              </span>
            </div>
          </div>

          <div id="shortener" className="scroll-mt-24 animate-fade-up [animation-delay:120ms]">
            <Card className="relative overflow-hidden border-border/70 bg-card/90 shadow-float backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-blue-600" />
              <CardContent className="p-6 pt-8 sm:p-8 sm:pt-10">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      Link shortener
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                      Make it shareable.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Paste any public HTTP or HTTPS link to get started.
                    </p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Link2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <CreateUrlForm onCreated={handleCreated} buttonLabel="Shorten URL" />

                {result ? (
                  <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Your short link is ready
                    </p>
                    <a
                      href={result.response.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all font-display text-lg font-bold text-primary hover:underline"
                    >
                      {result.response.short_url}
                    </a>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-[22rem] truncate text-xs text-muted-foreground" title={result.originalUrl}>
                        Original: {result.originalUrl}
                      </p>
                      <CopyButton value={result.response.short_url} label="Copy link" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
                    <MousePointer2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    Your new short link will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Need to keep track of your links?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="container-page scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Made for sharing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your links need.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A focused set of tools to create links, understand engagement, and stay in control.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Card
              key={title}
              className="group animate-fade-up border-border/70 transition duration-200 hover:-translate-y-1 hover:shadow-float"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardContent className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-white shadow-float sm:px-12 sm:py-14">
          <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Your links, organized</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Bring your links together.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Create an account to see click counts, update expiration, and manage every short URL.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/register">
                Create a free account <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
