# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Monolithic full-stack app — Next.js App Router (React Server Components by default) with Payload CMS 3 embedded in the same process, PostgreSQL as the system of record, and custom Next.js Route Handlers for site-specific APIs.

**Key Characteristics:**
- **Single deployable**: Public site, admin UI, REST/GraphQL APIs, and background job hooks share one Next.js app (`next.config.js` uses `withPayload` from `@payloadcms/next/withPayload`).
- **Content-driven pages**: CMS `pages` collection drives dynamic routes; layout is a blocks array rendered by a central mapper (`RenderBlocks`).
- **Server-first data access**: Server Components and Route Handlers call `getPayload({ config })` from `payload` with `config` imported from `@payload-config` (`src/payload.config.ts`).
- **Caching at the Next boundary**: Globals use `unstable_cache` with tags (`getCachedGlobal` in `src/utilities/getGlobals.ts`).

## Layers

**Presentation (Next.js App Router + React UI):**
- Purpose: HTTP entry for the public site and Payload admin shell; compose CMS data into HTML.
- Location: `src/app/(frontend)/`, `src/app/(payload)/`, `src/components/`, `src/blocks/`, `src/heros/`, `src/Header/`, `src/Footer/`
- Contains: Route segments (`page.tsx`, `layout.tsx`), client islands (`*.client.tsx` where used), block and hero components, shared UI.
- Depends on: Payload Local API (`getPayload`), generated types (`src/payload-types.ts`), utilities (`src/utilities/`), providers (`src/providers/`).
- Used by: End users (frontend), editors (admin under `(payload)`).

**CMS configuration (Payload schema & behavior):**
- Purpose: Define collections, globals, fields, access, hooks, plugins, and editor behavior.
- Location: `src/payload.config.ts`, `src/collections/`, `src/Header/config.ts`, `src/Footer/config.ts`, `src/GeneralSettings/config.ts`, `src/fields/`, `src/access/`, `src/plugins/`, collection-adjacent `hooks/` under each collection
- Contains: `CollectionConfig` / global configs, field factories, access functions, `beforeChange`/`afterChange`/`afterRead` hooks, plugin registration.
- Depends on: `payload`, database via adapter config, shared hooks in `src/hooks/` (e.g. `revalidateRedirects.ts`).
- Used by: Payload runtime, admin UI, REST/GraphQL handlers, any code calling Local API.

**Data & persistence:**
- Purpose: Store documents and media metadata; enforce constraints at DB level through Payload.
- Location: Configured in `src/payload.config.ts` (`postgresAdapter`); types in `src/payload-types.ts` (generated).
- Contains: PostgreSQL via `@payloadcms/db-postgres`; no separate ORM layer outside Payload.
- Depends on: `DATABASE_URL` (existence only; do not commit values).
- Used by: All Payload operations (find, create, update, globals, uploads).

**HTTP APIs (two channels):**
- Purpose: (1) Payload REST + GraphQL for CMS operations; (2) custom JSON endpoints for the public site (comments, auth callbacks, analytics helpers).
- Location: `src/app/(payload)/api/[...slug]/route.ts`, `src/app/(payload)/api/graphql/route.ts`, `src/app/(frontend)/api/**/route.ts`
- Contains: Generated REST handlers from `@payloadcms/next/routes`; hand-written Route Handlers using `getPayload`, `NextRequest`/`NextResponse`, and sometimes `createLocalReq` (e.g. `src/app/(frontend)/api/site-comments/route.ts`).
- Depends on: `payload`, `@payload-config`, access helpers under `src/access/`.
- Used by: Admin panel, live preview, frontend `fetch` calls, OAuth callbacks.

**Cross-cutting utilities:**
- Purpose: URL helpers, metadata, caching wrappers, UI classnames, seed data.
- Location: `src/utilities/`, `src/endpoints/seed/`, `scripts/` (operational seeds/migrations)
- Contains: Pure or server-only helpers; seed JSON and seeding logic consumed by endpoints or scripts.
- Depends on: Next (`draftMode`, `unstable_cache`), Payload types.
- Used by: Pages, API routes, hooks.

## Data Flow

**Public page (CMS `pages` document):**

1. Request hits a Next route (e.g. `src/app/(frontend)/[slug]/page.tsx` or root `src/app/(frontend)/page.tsx` re-exporting the same template).
2. Server Component resolves slug, calls a cached or direct `payload.find` / `findByID`-style query (see `queryPageBySlug` pattern in `[slug]/page.tsx`).
3. Optional: `draftMode()` enables preview; `LivePreviewListener` client component may render (`src/components/LivePreviewListener`).
4. `RenderHero` dispatches by `hero.type` (`src/heros/RenderHero.tsx`); `RenderBlocks` maps `layout[]` `blockType` to React components (`src/blocks/RenderBlocks.tsx`).
5. Response is RSC-rendered HTML; client components hydrate where marked with `'use client'`.

**Post detail (`posts` collection):**

1. `src/app/(frontend)/posts/[slug]/page.tsx` loads post by slug via Payload, renders post-specific layout (hero, content, related UI such as comments).
2. Comments list / create may use REST under `src/app/(frontend)/api/site-comments/` and client components (e.g. `src/components/Auth/PostComments.tsx`).

**Globals (header, footer, settings):**

1. Root layout `src/app/(frontend)/layout.tsx` calls `getCachedGlobal('general-settings', 1)` for favicon and related data.
2. `Header` / `Footer` components load their global documents (pattern: globals configured in `src/payload.config.ts` as `Header`, `Footer`, `GeneralSettings`).

**Payload admin & CMS API:**

1. Editors use routes under `src/app/(payload)/admin/` with layout `src/app/(payload)/layout.tsx` (generated wrapper around `RootLayout` from `@payloadcms/next/layouts`).
2. REST requests go to `src/app/(payload)/api/[...slug]/route.ts` exports (`REST_GET`, `REST_POST`, etc.).
3. GraphQL hits `src/app/(payload)/api/graphql/route.ts`.

**State Management:**
- **Server**: Request-scoped React tree; no global Redux store. Theme and auth use React context in `src/providers/` (`ThemeProvider`, `AuthProvider`, `QueryProvider` for TanStack Query).
- **CMS**: Authoritative state in PostgreSQL; preview uses Next `draftMode`.
- **Caching**: `unstable_cache` on globals (`src/utilities/getGlobals.ts`); collection hooks trigger revalidation (e.g. `src/collections/Pages/hooks/revalidatePage.ts`, `src/collections/Posts/hooks/revalidatePost.ts`).

## Key Abstractions

**`getPayload` + `@payload-config`:**
- Purpose: Obtain a Payload instance for Local API calls in RSC, Route Handlers, and hooks.
- Examples: `src/app/(frontend)/[slug]/page.tsx`, `src/utilities/getGlobals.ts`, `src/app/(frontend)/api/site-comments/route.ts`
- Pattern: `const payload = await getPayload({ config: configPromise })` with `configPromise` imported as `config`/`configPromise` from `@payload-config`.

**Block registry (`RenderBlocks`):**
- Purpose: Map CMS `layout` block `blockType` strings to React components.
- Examples: `src/blocks/RenderBlocks.tsx` — object `blockComponents` keyed by slug (`archive`, `content`, `cta`, …).
- Pattern: Adding a block requires a `blocks` field entry in the collection, a component under `src/blocks/<Name>/Component.tsx`, and a new key in `blockComponents`.

**Hero registry (`RenderHero`):**
- Purpose: Map `hero.type` to hero components (`highImpact`, `lowImpact`, `mediumImpact`).
- Examples: `src/heros/RenderHero.tsx`, implementations under `src/heros/HighImpact`, `LowImpact`, `MediumImpact`, `PostHero`.

**Globals cache (`getCachedGlobal`):**
- Purpose: Typed, tag-based cached reads of Payload globals for use in layouts.
- Examples: `src/utilities/getGlobals.ts`, usage in `src/app/(frontend)/layout.tsx`
- Pattern: `getCachedGlobal('header', depth)( )` — note invocation returns a cached async function.

**Access control modules:**
- Purpose: Centralize role and membership checks for collections and custom APIs.
- Examples: `src/access/isAdminUser.ts`, `src/access/siteMemberUser.ts`, re-export patterns in `src/collections/Users/index.ts`
- Pattern: Boolean or query constraints per Payload `Access` API; custom APIs also call helpers to align with the same rules.

**Plugins stack:**
- Purpose: SEO, redirects, search index, nested docs, form builder, MCP — configured once in `src/plugins/index.ts` and merged in `buildConfig`.
- Examples: `src/plugins/index.ts`, referenced from `src/payload.config.ts`

## Entry Points

**Next.js application (development / production):**
- Location: `package.json` scripts — `next dev --turbopack`, `next build`, `next start`
- Triggers: Process start, Vercel or Node host
- Responsibilities: Compile routes, run Server Components, serve static assets from `public/`

**Public site routes:**
- Location: `src/app/(frontend)/layout.tsx` (root HTML shell), `src/app/(frontend)/page.tsx` (re-exports `[slug]` page for home), `src/app/(frontend)/[slug]/page.tsx`, `src/app/(frontend)/posts/**`, `src/app/(frontend)/categories/**`, `src/app/(frontend)/search/page.tsx`
- Triggers: HTTP GET to matching paths
- Responsibilities: SSR/SSG pages, metadata generation (`generateMetadata`), static params where implemented

**Payload admin:**
- Location: `src/app/(payload)/admin/[[...segments]]/`, `src/app/(payload)/layout.tsx`
- Triggers: Navigating to `/admin`
- Responsibilities: CMS UI, authentication against `users` collection

**Payload REST / GraphQL:**
- Location: `src/app/(payload)/api/[...slug]/route.ts`, `src/app/(payload)/api/graphql/route.ts`
- Triggers: HTTP clients (including admin and headless consumers)
- Responsibilities: CRUD and GraphQL per Payload rules

**Custom site APIs:**
- Location: `src/app/(frontend)/api/auth/google/route.ts`, `callback/route.ts`, `src/app/(frontend)/api/site-comments/route.ts`, `like/route.ts`, `src/app/(frontend)/api/posts/[id]/increment-views/route.ts`, `src/app/(frontend)/api/geo-ip/route.ts`
- Triggers: `fetch` from client components or external OAuth redirects
- Responsibilities: JSON responses, OAuth exchange, comment CRUD, view counts, geo helpers

**Operational scripts (DB/content maintenance):**
- Location: `scripts/*.ts` (invoked via `bun run` per `package.json`, e.g. `seed`, `migrate:admin-roles`)
- Triggers: Maintainer CLI
- Responsibilities: Seeding, one-off migrations, media fixes

## Error Handling

**Strategy:** Layered — Payload throws `APIError` for API semantics; Route Handlers map to `NextResponse.json` with HTTP status; UI surfaces errors via component state or thrown boundaries where applicable.

**Patterns:**
- Custom APIs: validate query/body early, return `NextResponse.json({ error: '...' }, { status: 4xx })` (see `src/app/(frontend)/api/site-comments/route.ts`).
- Payload operations: rely on `APIError` and access control denials from Local API.
- Page not found / redirects: `PayloadRedirects` component for redirect plugin integration (`src/components/PayloadRedirects`).

## Cross-Cutting Concerns

**Logging:** No dedicated logger module detected in `src/`; use `console` in scripts and typical Next server logging. Prefer structured logging only if introduced project-wide.

**Validation:** Payload field validation and hooks on collections; Route Handlers perform explicit param parsing and guards before `getPayload` calls.

**Authentication:**
- **CMS users**: Payload `users` collection with auth; admin session via Payload.
- **Site auth**: Google OAuth routes under `src/app/(frontend)/api/auth/google/`; client `AuthProvider` (`src/providers/Auth`) for session UX.
- **Access**: Reuse `src/access/*` in both Payload config and custom routes; when passing `user` to Local API, follow project rule: set `overrideAccess: false` unless intentionally elevating (see `AGENTS.md` / security rules).

**Internationalization:** Payload `i18n` with `en` and `vi` in `src/payload.config.ts`; root layout sets `lang="vi"`.

**Jobs / cron:** `jobs` config in `src/payload.config.ts` — `access.run` allows authenticated user or `Authorization: Bearer` with `CRON_SECRET`.

---

*Architecture analysis: 2026-04-19*
