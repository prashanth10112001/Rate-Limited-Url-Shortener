import { mkdir, writeFile } from "node:fs/promises"

const siteUrl = (
  process.env.VITE_SITE_URL || "https://your-app.vercel.app"
).replace(/\/+$/, "")
const publicDirectory = new URL("../public/", import.meta.url)

await mkdir(publicDirectory, { recursive: true })
await Promise.all([
  writeFile(
    new URL("sitemap.xml", publicDirectory),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${siteUrl}/</loc></url>\n` +
      `</urlset>\n`,
  ),
  writeFile(
    new URL("robots.txt", publicDirectory),
    `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /dashboard\n` +
      `Disallow: /urls/\n` +
      `Disallow: /login\n` +
      `Disallow: /register\n` +
      `Disallow: /unauthorized\n` +
      `Sitemap: ${siteUrl}/sitemap.xml\n`,
  ),
])
