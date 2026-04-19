# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**IP geolocation (frontend API):**
- ipgeolocation.io — Primary lookup when `IPGEOLOCATION_API_KEY` is set (`src/app/(frontend)/api/geo-ip/route.ts`)
  - Integration: HTTPS GET to `https://api.ipgeolocation.io/v3/ipgeo`
  - Auth: API key via `IPGEOLOCATION_API_KEY` env var
- ip-api.com — Fallback when ipgeolocation key is absent or for failure paths; HTTP JSON endpoint (`http://ip-api.com/json/...`) per same route file

**Google OAuth (user sign-in):**
- Google OAuth 2.0 — Browser redirect flow for frontend auth (`src/app/(frontend)/api/auth/google/route.ts`, `src/app/(frontend)/api/auth/google/callback/route.ts`)
  - SDK: `google-auth-library` ^10.6.2 (`OAuth2Client`, token verification)
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (documented in `.env.example`)

**Payload MCP (AI/tooling):**
- Model Context Protocol HTTP endpoint — `/api/mcp` (see `@payloadcms/plugin-mcp` in `src/plugins/index.ts`)
  - Auth: Bearer token from Payload Admin → MCP → API Keys (per plugin comment in `src/plugins/index.ts`)
  - Collections/globals exposed with granular `enabled` flags for find/create/update/delete

**GraphQL:**
- Payload GraphQL API — `POST` handler at `src/app/(payload)/api/graphql/route.ts` (generated wrapper using `GRAPHQL_POST` from `@payloadcms/next/routes`); `graphql` package is a dependency of Payload

## Data Storage

**Databases:**
- PostgreSQL — Primary store for Payload via `@payloadcms/db-postgres`
  - Connection: `DATABASE_URL` env var (`src/payload.config.ts` `postgresAdapter` `pool.connectionString`)
  - Migrations/schema: Managed by Payload (no separate Prisma/Drizzle layer in this repo)

**File Storage:**
- Local filesystem — Uploads for `media` collection use `staticDir` pointing under `public/media` (`src/collections/Media.ts`); files served as static assets by Next.js
- Not detected: S3, Cloudinary, or other remote storage adapters in `src/payload.config.ts`

**Caching:**
- Next.js `fetch` / `revalidateTag` / `revalidatePath` — Cache invalidation from Payload hooks (e.g. `src/collections/Posts/hooks/revalidatePost.ts`, `src/hooks/revalidateRedirects.ts`); no Redis or external cache service in code

## Authentication & Identity

**Auth provider:**
- Payload CMS built-in authentication — `users` collection (`src/collections/Users`); JWT/session behavior per Payload defaults
- Google OAuth — Supplemental sign-in flow for the frontend (routes under `src/app/(frontend)/api/auth/google/`); uses `google-auth-library` and env vars above

**Preview / drafts:**
- Draft preview — `PREVIEW_SECRET` validated in `src/app/(frontend)/next/preview/route.ts` (matches Payload live preview patterns)

## Monitoring & Observability

**Error tracking:**
- Not detected — No Sentry, Datadog, or similar client in `package.json` dependencies

**Logs:**
- Payload logger usage in routes (e.g. `src/app/(frontend)/next/seed/route.ts`); otherwise standard Node/Next stdout

## CI/CD & Deployment

**Hosting:**
- Not pinned in repo — No `vercel.json` in workspace; Vercel-oriented env vars (`VERCEL_PROJECT_PRODUCTION_URL`) used in `src/utilities/getURL.ts` and `next.config.js` for production URL resolution

**CI pipeline:**
- Not detected — No `.github/workflows/*.yml` in the repository

## Environment Configuration

**Required env vars (from `.env.example` and code):**
- `DATABASE_URL` — PostgreSQL connection string
- `PAYLOAD_SECRET` — Payload secret/cookie signing
- `NEXT_PUBLIC_SERVER_URL` — Public site URL (no trailing slash per example)
- `CRON_SECRET` — Bearer token for unauthenticated access to Payload `jobs` runner when configured (`src/payload.config.ts` `jobs.access.run`)
- `PREVIEW_SECRET` — Draft preview URL validation
- Optional: `IPGEOLOCATION_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`

**Secrets location:**
- Local: `.env` / `.env.local` (gitignored; do not commit). See `.env.example` for variable names only.

## Webhooks & Callbacks

**Incoming:**
- OAuth callback — `GET` `src/app/(frontend)/api/auth/google/callback/route.ts` (Google redirects here; state and code exchange)
- Payload REST — Catch-all `src/app/(payload)/api/[...slug]/route.ts` for Payload API routes
- GraphQL — `src/app/(payload)/api/graphql/route.ts`
- MCP — `/api/mcp` (Payload MCP plugin)

**Outgoing:**
- Google OAuth authorization and token endpoints (via `google-auth-library` redirects and token exchange)
- ipgeolocation.io and ip-api.com (server-side HTTP from `src/app/(frontend)/api/geo-ip/route.ts`)

**Cron / scheduled jobs:**
- Payload `jobs` access allows `Authorization: Bearer ${CRON_SECRET}` when no user session (`src/payload.config.ts`); `tasks` array is empty in config — extend when adding scheduled work

---

*Integration audit: 2026-04-19*
