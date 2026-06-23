# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A detailed `AGENTS.md` (Payload patterns, security rules, migration discipline) and per-topic rules in `.cursor/rules/` (collections, fields, access-control, hooks, queries, endpoints, adapters, components, plugin-development, security-critical) already exist. Read the relevant one before editing that subsystem; this file is the high-level orientation.

## What this is

AI VIETNAM — a Payload CMS 3.x app running **inside** Next.js 15 (App Router, React 19). It started from the official Payload Website Template and adds custom domains: **Listings** (marketplace), **Livestreams + realtime chat** (Stream.io), and a **Comments** system with moderation. Database is **Postgres** (`@payloadcms/db-postgres`).

## Commands

- `pnpm dev` — dev server at `http://localhost:3000` (Turbopack)
- `pnpm build` — production build (`next build --experimental-build-mode compile`); `pnpm start` to serve; `pnpm dev:prod` for a clean build+serve
- `pnpm lint` / `pnpm lint:fix` — ESLint (Next core-web-vitals + TS)
- `npx tsc --noEmit` — **the real type check.** `next build` sets `ignoreBuildErrors` + `ignoreDuringBuilds`, so a green build does NOT mean types/lint pass. Run `tsc --noEmit` after edits.
- `pnpm generate:types` — **run after any collection/field change**; regenerates `src/payload-types.ts` (never hand-edit). `autoGenerate` is off, so it never runs implicitly.
- `pnpm generate:importmap` — regenerate `app/(payload)/admin/importMap.js` after adding/changing admin components
- `pnpm test` — int then e2e · `pnpm test:int` (Vitest) · `pnpm test:e2e` (Playwright, auto-starts dev server)
  - Run one int test: `pnpm test:int <file-or-pattern>` · one e2e: `pnpm test:e2e -g "<title>"`
- Seeders run via **bun**: `pnpm seed`, `seed:listings`, `seed:footer`, `seed:media`, `seed:media-items`; `pnpm migrate:admin-roles`

Package manager is **pnpm** (engines: pnpm 9/10) for app commands; seed/migration scripts shell out to **bun**. Payload is **patched** (`patches/payload@3.79.1.patch`) — reinstalls must preserve it.

## Architecture

- **Two route groups** under `src/app`: `(frontend)` is the public site (`[slug]`, `posts`, `listings`, `live`, `broadcaster`, `categories`, `media-items`, `search`, plus `api/*` route handlers); `(payload)` serves the admin UI and Payload REST/GraphQL.
- **`src/payload.config.ts`** is the wiring hub — registers all collections, globals (`Header`, `Footer`, `GeneralSettings`), plugins (from `src/plugins`), the Postgres adapter (`push: false`), Lexical editor, live-preview breakpoints, and Vercel-cron-gated jobs. (S3/R2 storage is scaffolded but commented out; media is served from disk + a dev proxy — see Environment.)
- **Content model** in `src/collections/*` (Pages, Posts, Media, Categories, Users, Listings, ListingCategories, Livestreams + chat collections, Comments + CommentLikes + CommentModerationRules, Media{Categories,Items,Gifs}). Globals live in `src/Header`, `src/Footer`, `src/GeneralSettings`.
- **Layout builder**: Pages/Posts store a `layout` array of blocks. Each block is `src/blocks/<Block>/{config.ts,Component.tsx}`; `src/blocks/RenderBlocks.tsx` maps `blockType` → component. Adding a block = create the pair, add it to the collection's `layout` field, register it in `RenderBlocks.tsx`, then `generate:types`.
- **Data access**: server-side via Payload Local API (`getPayload({ config })`). Reads are wrapped in `unstable_cache` and tagged by collection/slug in `src/utilities/*` (`getGlobals`, `getDocument`, `getMeUser`, `getRedirects`, `generateMeta`); collection hooks in `src/hooks` call `revalidateTag`/`revalidatePath`. Prefer these utilities over calling Payload directly in components.
- **Access control**: compose from `src/access` (`anyone`, `authenticated`, `authenticatedOrPublished`, `adminOnly`, `adminOrSelf`, `isAdminUser` → `canAccessAdminPanel`, `siteMemberUser`/`authenticatedSiteMember`); `Users` also has role helpers in `src/collections/Users/access` (`admin`/`editor`/`mod`/`member` via `checkRole`). Roles are `admin | editor | moderator | member` (default `member`), `saveToJWT: true`. Don't inline role checks — reuse these.
- **Realtime**: Stream.io via `@stream-io/node-sdk` (server tokens) and `@stream-io/video-react-sdk` / `stream-chat` (client). Routes under `(frontend)/live`, `broadcaster`, and `api/stream`, `api/livestream-chat`. Credentials are server-only env.
- **Edge auth layer**: `src/middleware.ts` is a Next edge middleware that guards `/broadcaster/*` by manually decoding the `payload-token` JWT's `roles` claim (admin/moderator) — a second access gate *separate* from the `src/access` helpers (which protect the admin/API). When changing broadcaster access or the roles set, update both.
- **Plugins**: wired in `src/plugins/index.ts` — official Payload plugins (`form-builder`, `mcp`, `nested-docs`, `redirects`, `search`, `seo`) plus a custom `audit-logs` plugin (`src/plugins/audit-logs.ts`). The `mcp` plugin exposes collections over MCP; the SEO plugin derives title/URL from the `general-settings` global.

## Conventions & gotchas

- Path aliases: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`. Use them instead of deep relative imports.
- Style (Prettier): 2-space indent, single quotes, semicolons, **no trailing commas**.
- Default to React Server Components; add `'use client'` only for genuine client islands and keep secrets/tokens server-side.
- Import generated types (`Post`, `Page`, …) from `@/payload-types`.
- i18n: admin supports `en` + `vi` (fallback `en`). Media uploads cap at 30MB.

## Postgres migrations (critical — see AGENTS.md for full rules)

The DB adapter sets `push: false` because dev shares the production Postgres instance — **migrations are the source of truth, schema is never auto-pushed.** After any schema change:
1. Hand-author a **small, narrowly scoped** migration in `src/migrations/*.ts` and register it in `src/migrations/index.ts`.
2. With the DB tunnel open (see Environment), `CI=true PAYLOAD_MIGRATING=true bunx payload migrate` → `pnpm generate:types` → `npx tsc --noEmit`. This applies **directly to production** — for additive migrations run it before pushing/deploying; coordinate destructive ones.
- Do **not** use `payload migrate:create` here — it generates unrelated drops/renames from schema drift. Write idempotent SQL (`IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`). Keep `blockType`/field names stable; renames need an explicit migration.

## Environment

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL` (Postgres connection string), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET` (gates Payload job execution — Vercel cron auth), and Stream.io keys for livestream/chat. In dev, set `NEXT_PUBLIC_ENV=dev` to proxy `/api/media/file/*` to the remote server (uploaded files live on its disk, not locally).

**Database (self-hosted).** Postgres now runs in a container (`aivietnam-db`, Postgres 17) on the production VPS, bound to `127.0.0.1:5432` — it is **not** publicly reachable. Local dev connects to it through an SSH tunnel (`scripts/db-tunnel.sh`: local `5433` → VPS `5432`), and `DATABASE_URL` in `.env` points at `localhost:5433`. **`pnpm dev` auto-opens the tunnel** (via `scripts/dev.sh`) and closes it on exit; use `pnpm dev:no-tunnel` to skip. ⚠️ Local dev therefore talks to the **live production DB** — never run seeders (`pnpm seed*`) against it, and be aware admin autosave/edits write to prod. The app is deployed as a Docker container (GitHub Actions → GHCR → VPS) on the `aivietnam-net` network alongside the DB; daily `pg_dump` backups run on the VPS. (Neon was the previous provider; migrated off after hitting free-tier compute limits.)
