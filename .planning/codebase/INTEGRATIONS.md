# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**IP geolocation (comments / geo features):**
- IPGeolocation.io — Primary lookup when `IPGEOLOCATION_API_KEY` is set; HTTPS `https://api.ipgeolocation.io/v3/ipgeo` with `apiKey` query param (`src/app/(frontend)/api/geo-ip/route.ts`).
- ip-api.com — Fallback when the API key is absent; HTTP `http://ip-api.com/json/...` (`lookupIpApi` in same file).

**Google OAuth (frontend sign-in):**
- Google OAuth 2.0 — Authorization code flow; `google-auth-library` in `src/app/(frontend)/api/auth/google/callback/route.ts` for token exchange.
- Environment: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (see `.env.example`); callback route `src/app/(frontend)/api/auth/google/callback/route.ts`, start route `src/app/(frontend)/api/auth/google/route.ts`.
- User linkage: `googleSub` on `Users` collection (`src/collections/Users/index.ts`).

**Payload MCP (AI/tooling):**
- Model Context Protocol HTTP endpoint — Exposed by `@payloadcms/plugin-mcp` at `/api/mcp` (per plugin comment in `src/plugins/index.ts`); authentication via Bearer token from Admin → MCP → API Keys (not hardcoded in repo).

**GraphQL:**
- Payload GraphQL API — Routes `src/app/(payload)/api/graphql/route.ts` and playground `src/app/(payload)/api/graphql-playground/route.ts` (standard Payload + Next integration).

## Data Storage

**Databases:**
- PostgreSQL — Primary store via `@payloadcms/db-postgres`; connection string `process.env.DATABASE_URL` in `src/payload.config.ts` (`pool.connectionString`).

**File Storage:**
- Local filesystem — Uploads for `media` collection: `staticDir` resolves to `public/media` under the Next app (`src/collections/Media.ts`); served as static assets, not S3/blob in current config.

**Caching:**
- Not detected — No Redis or dedicated cache client in `package.json` or primary config.

## Authentication & Identity

**Auth provider:**
- Payload built-in auth — `Users` collection with `auth: true` (`src/collections/Users/index.ts`); JWT/session behavior from Payload + `PAYLOAD_SECRET`.

**OAuth integrations:**
- Google — Optional; see APIs section and `.env.example`.

**Cron / background jobs:**
- Payload `jobs` config — Unauthenticated access to job runner requires `Authorization: Bearer ${CRON_SECRET}` when no user session (`process.env.CRON_SECRET` in `src/payload.config.ts`), aligned with Vercel Cron-style calls.

## Monitoring & Observability

**Error tracking:**
- Not detected — No Sentry or similar SDK in `package.json`.

**Analytics:**
- Not detected in dependencies.

**Logs:**
- Application logging not centralized; typical Next.js/Node stdout on the host platform.

## CI/CD & Deployment

**Hosting:**
- Vercel-oriented — `VERCEL_PROJECT_PRODUCTION_URL` used for canonical URLs in `next.config.js`, `src/utilities/getURL.ts`, sitemap routes, and `next-sitemap.config.cjs`; no `vercel.json` in repo at analysis time.

**CI pipeline:**
- Not detected — No `.github/workflows` present at analysis time.

## Environment Configuration

**Required env vars (operational minimum):**
- `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` — Core CMS and URL generation (see `.env.example`).

**Common optional vars:**
- `PREVIEW_SECRET` — Draft preview validation (`src/app/(frontend)/next/preview/route.ts`, `src/utilities/generatePreviewPath.ts`).
- `CRON_SECRET` — Secured job execution without admin user (`src/payload.config.ts`).
- `IPGEOLOCATION_API_KEY` — Enables HTTPS geolocation path in `/api/geo-ip`.
- Google OAuth trio — Enables Google sign-in flow.

**Secrets location:**
- Local: `.env` / `.env.local` (gitignored); never commit values. `.env.example` lists names only.

## Webhooks & Callbacks

**Incoming:**
- OAuth callback — `GET` (or as configured) `src/app/(frontend)/api/auth/google/callback/route.ts` — Google redirects here; must match `GOOGLE_OAUTH_REDIRECT_URI` and Google Cloud console.
- Payload REST / GraphQL — `src/app/(payload)/api/[...slug]/route.ts` and GraphQL routes — CMS API surface (authentication per Payload rules).

**Outgoing:**
- Outbound HTTP — `fetch` to IP geolocation providers from `src/app/(frontend)/api/geo-ip/route.ts` only among custom routes reviewed; no third-party webhook fan-out detected.

---

*Integration audit: 2026-04-19*
