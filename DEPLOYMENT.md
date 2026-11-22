# Linkly deployment

## Frontend on Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Set the project **Root Directory** to `frontend`.
3. Use the Vite framework preset, with:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Configure these Vercel environment variables for Production (and Preview if
   desired):
   - `VITE_API_URL`: public Render API origin, e.g.
     `https://your-api.onrender.com` (no trailing slash).
   - `VITE_SITE_URL`: canonical frontend origin, e.g.
     `https://your-app.vercel.app`.
5. Redeploy after setting or changing environment variables. The build
   generates `sitemap.xml` and `robots.txt` from `VITE_SITE_URL`.

`frontend/vercel.json` rewrites client-side routes to `index.html`, so direct
navigation and refresh work for `/dashboard`, `/urls/:shortCode`, and custom
error routes.

## Backend on Render

1. Create a Render **Web Service** from the GitHub repository and set its Root
   Directory to `backend`.
2. Use Python. Set:
   - Build command: `pip install -r requirements.txt && alembic upgrade head`
   - Start command:
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/health`
3. Create a Render PostgreSQL database. Use its **internal** connection
   details for the web service. Set `DATABASE_URL` to a SQLAlchemy URL using
   the psycopg2 driver, for example
   `postgresql+psycopg2://USER:PASSWORD@HOST:5432/DATABASE`. URL-encode
   reserved characters in credentials.
4. Create a Render Key Value (Redis-compatible) instance and configure
   `REDIS_URL` with its private/internal connection URL.
5. Add the environment variables listed below to the web service. Set
   `BASE_URL` to the public API origin, `FRONTEND_BASE_URL` to the Vercel
   origin, and `CORS_ORIGINS` to the exact comma-separated frontend origins
   allowed to call the API.
6. Deploy. Confirm `/health` returns HTTP 200 after PostgreSQL and Redis are
   ready. It returns 503 while either dependency is unavailable, allowing
   Render and the frontend to detect startup readiness.

For a free service that may sleep, the app performs a health check when a
protected area is opened and when a user submits a form. During a cold start it
shows a loading state; failed readiness checks can be retried manually. It does
not send background keep-alive pings.

## Environment variables

Copy the backend root `.env.example` for local backend configuration and
`frontend/.env.example` for local frontend configuration. Do not commit real
credentials.

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `BASE_URL` | Yes | Public origin used to construct generated short links. |
| `FRONTEND_BASE_URL` | Production | Frontend origin used for browser redirects when a short code is unknown or expired. |
| `CORS_ORIGINS` | Yes | Comma-separated, exact browser frontend origins. |
| `DATABASE_URL` | Yes | SQLAlchemy PostgreSQL connection URL. |
| `POSTGRES_USER` | Yes | PostgreSQL username (also required by settings). |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password (also required by settings). |
| `POSTGRES_DB` | Yes | PostgreSQL database name (also required by settings). |
| `POSTGRES_HOST` | No | PostgreSQL host; defaults to `localhost`. |
| `POSTGRES_PORT` | No | PostgreSQL port; defaults to `5432`. |
| `REDIS_URL` | Yes | Redis-compatible cache and rate limiter connection URL. |
| `RATE_LIMIT_CAPACITY` | Yes | Token-bucket capacity. |
| `RATE_LIMIT_REFILL_RATE` | Yes | Token-bucket refill rate. |
| `SECRET_KEY` | Yes | Strong secret used to sign access tokens. Generate a unique production value. |
| `ALGORITHM` | No | JWT signing algorithm; defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime; defaults to 30 minutes. |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Production | Public backend origin used by Axios and the health check. Leave empty locally to use the Vite proxy. |
| `VITE_API_PROXY_TARGET` | Development | Backend origin for the Vite `/api`, `/auth`, and `/health` proxies; defaults to `http://localhost:8000`. |
| `VITE_SITE_URL` | Production SEO | Canonical site origin used when generating the sitemap and robots file. |

Frontend values are compiled into static assets at build time. Set the Vercel
environment variables before building; do not put secrets in `VITE_*` values.

## Frontend–backend connection

### Development

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Leave `VITE_API_URL` empty so Vite proxies `/api`, `/auth`, and `/health`.
- Set backend `CORS_ORIGINS=http://localhost:5173` and
  `FRONTEND_BASE_URL=http://localhost:5173`.

### Production

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-api.onrender.com`
- Set frontend `VITE_API_URL=https://your-api.onrender.com`.
- Set backend `BASE_URL=https://your-api.onrender.com`,
  `FRONTEND_BASE_URL=https://your-app.vercel.app`, and
  `CORS_ORIGINS=https://your-app.vercel.app`.
- For a custom Vercel domain, include each exact frontend origin in
  `CORS_ORIGINS` as a comma-separated value, for example
  `https://your-app.vercel.app,https://links.example.com`.

## Backend CORS configuration

The backend configures FastAPI `CORSMiddleware` from `CORS_ORIGINS`. No
additional manual middleware changes are required:

- Development: `CORS_ORIGINS=http://localhost:5173`.
- Production: use the exact deployed Vercel origin.
- Vercel preview/custom domains: add each permitted origin explicitly,
  comma-separated. Do not use `*` with credentials enabled.

The middleware permits the API methods and authorization/content headers used
by the frontend. The frontend stores JWTs and sends them in the `Authorization`
header; it does not rely on cross-origin cookies.
