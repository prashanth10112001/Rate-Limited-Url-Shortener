# Linkly frontend

A React 19, TypeScript, and Vite application for the URL shortener backend. The UI uses Tailwind CSS 4 and local shadcn-style components, React Router, Axios, React Hook Form, Zod, Sonner, and Lucide icons.

The theme follows the operating system preference on first visit. A light/dark
selection made with the navbar toggle is saved in local storage.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- The FastAPI backend and its configured PostgreSQL/Redis services

## Install and run

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.
The development server is normally available at `http://localhost:5173`.

The Vite development proxy forwards `/api/*` and `/auth/*` to
`http://localhost:8000` by default, so local browser requests remain same-origin
and do not need backend CORS changes.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | Empty (same-origin) | Optional Axios and health-check API origin. Leave empty to use the Vite proxy in development. |
| `VITE_API_BASE_URL` | Empty (same-origin) | Legacy alias for `VITE_API_URL`. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | FastAPI target used by Vite for `/api` and `/auth` routes. |
| `VITE_SITE_URL` | `http://localhost:5173` | Canonical public site origin used for sitemap generation at build time. |

For a deployed frontend, serve it behind the same-origin reverse proxy as the
API, or set `VITE_API_BASE_URL` to the API origin and configure the backend to
allow that frontend origin through CORS.

Set the backend's `FRONTEND_BASE_URL` to the deployed frontend origin as well.
Browser requests for unknown or expired short links will then open the themed
frontend error pages; non-browser API requests retain their JSON 404/410
responses.

## Backend connection

Start the backend and its required services using the repository's existing
backend configuration, then run the frontend. The frontend calls:

- `POST /auth/register`, `POST /auth/login`, and `GET /auth/me`
- `POST /api/shorten` and `GET /api/my-urls`
- `GET /api/stats/{code}`
- `GET /api/stats/{code}/clicks` (paginated with `limit` and `offset`, searchable
  with `search`, and sortable with `sort_by` / `sort_direction`)
- `PATCH /api/urls/{code}/expiration` and `DELETE /api/urls/{code}`

Request and response types mirror the FastAPI schemas. URL input validation
requires an HTTP or HTTPS URL, disallows embedded credentials, and caps input
length at 2048 characters. Registration validates the email format.

The backend exposes both aggregate counts and authenticated click records. The
click endpoint returns the stored fields (timestamp, IP address, user agent,
and referrer) for links owned by the authenticated user. Browser and device
classification are not currently stored by the backend.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run lint
npm run preview
```
