import { Helmet } from "react-helmet-async"

const DEFAULT_DESCRIPTION =
  "Create clean short URLs, manage your links, and understand click activity with Linkly."

export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  noIndex = false,
  structuredData,
}: {
  title: string
  description?: string
  canonicalPath?: string
  noIndex?: boolean
  structuredData?: Record<string, unknown>
}) {
  const canonicalUrl = canonicalPath
    ? new URL(canonicalPath, window.location.origin).toString()
    : undefined

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Linkly" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}
