# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Monolithic full-stack application — Next.js App Router (React Server Components) co-located with Payload CMS 3, sharing one deployment and PostgreSQL-backed content.

**Key Characteristics:**
- Single Next.js process serves the public site, custom App Router API routes, and Payload’s admin UI and REST/GraphQL APIs under route groups.
- Content model lives in Payload (`collections`, `globals`, `plugins`); the frontend reads via Payload Local API (`getPayload`) from Server Components and route handlers.
- Presentation is block-based: CMS `layout` blocks map to React components through a central renderer (`RenderBlocks`).
- No separate BFF: Next.js route handlers and RSCs call Payload directly; caching uses Next.js `unstable_cache` with collection/slug tags where implemented.

## Layers

**Routing & HTTP (Next.js App Router):**
- Purpose: URL mapping, HTML streaming, metadata, draft mode, and custom HTTP APIs for the site.
- Location: `src/app/(frontend)/`, `src/app/(payload)/`
- Contains: `page.tsx` / `layout.tsx` for pages; `route.ts` for REST endpoints, previews, sitemaps, seed.
- Depends on: Payload config (`@payload-config`), `payload` Local API, shared UI (`@/components`, `@/blocks`, `@/heros`), utilities.
- Used by: Browsers, crawlers, admin users (preview/exit-preview), cron/integrations hitting job or custom routes.

**CMS & data (Payload):**
- Purpose: Schema (collections/globals), access control, hooks, plugins, search indexing, and generated types.
- Location: `src/payload.config.ts`, `src/collections/`, `src/Header/`, `src/Footer/`, `src/GeneralSettings/`, `src/plugins/`, `src/access/`, `src/hooks/` (shared), collection-local `hooks/` under each collection.
- Contains: Collection configs, field definitions, `beforeChange`/`afterChange`/`afterRead` hooks, revalidation hooks, plugin wiring.
- Depends on: PostgreSQL (via `@payloadcms/db-postgres`), env-backed secrets, Sharp for image pipeline.
- Used by: Admin UI, REST/GraphQL handlers generated under `src/app/(payload)/api/`, and all server code using `getPayload`.

**Presentation (blocks, heroes, components):**
- Purpose: Map CMS JSON to React; shared chrome (header/footer), rich text, media, auth UI.
- Location: `src/blocks/` (per-block folders + `RenderBlocks.tsx`), `src/heros/` + `RenderHero`, `src/components/`, `src/Header/Component`, `src/Footer/Component`.
- Contains: Server/client components as needed; block registry in `RenderBlocks` maps `blockType` strings to components.
- Depends on: `payload-types` shapes, utilities (`@/utilities/*`), providers for client state.
- Used by: App Router pages (e.g. `src/app/(frontend)/[slug]/page.tsx`, `src/app/(frontend)/posts/[slug]/page.tsx`).

**Client state & theming:**
- Purpose: Theme, header theme, TanStack Query, and auth/session context for interactive UI.
- Location: `src/providers/` (`Theme`, `HeaderTheme`, `Query`, `Auth`).
- Contains: React context providers wrapping the tree from `src/app/(frontend)/layout.tsx`.
- Depends on: Client-only APIs where applicable (`'use client'` modules).
- Used by: Interactive components (e.g. under `src/components/Auth/`).

**Cross-cutting utilities:**
- Purpose: URL helpers, caching wrappers for globals/documents, metadata, redirects resolution, UI classnames.
- Location: `src/utilities/`
- Contains: `getCachedDocument` / `getCachedGlobal`, `generateMeta`, `getRedirects`, `mergeOpenGraph`, etc.
- Depends on: `payload`, `next/cache`, config.
- Used by: Layouts, pages, SEO-related code.

**Search (plugin integration):**
- Purpose: Search plugin field overrides and sync hooks feeding Payload search.
- Location: `src/search/` (`fieldOverrides.ts`, `beforeSync.ts`, `Component.tsx`)
- Depends on: `searchPlugin` in `src/plugins/index.ts`
- Used by: Search-related UI and indexing behavior.

**Bootstrap & seed data:**
- Purpose: One-off or dev seed payloads and static fallbacks.
- Location: `src/endpoints/seed/` (referenced from routes and pages, e.g. `home-static`)

## Data Flow

**Public CMS page (`/[slug]`):**

1. Request hits `src/app/(frontend)/[slug]/page.tsx` (or catch-all static generation in production).
2. Server code resolves `draftMode`, obtains `getPayload({ config })`, and loads the `pages` document by slug (with access and draft semantics as coded).
3. Metadata is built via `generateMeta` (`src/utilities/generateMeta.ts`).
4. `RenderHero` and `RenderBlocks` turn `hero` and `layout` arrays into React trees; nested relationships use Payload `depth` as passed in queries.
5. Optional client wrapper (`page.client.tsx`) and `LivePreviewListener` hydrate for preview UX.
6. HTML streams to the client inside `RootLayout` (`src/app/(frontend)/layout.tsx`), which also loads globals for chrome (header/footer from `getCachedGlobal`).

**Post detail (`/posts/[slug]`):**

1. `src/app/(frontend)/posts/[slug]/page.tsx` loads from `posts` collection via Local API patterns consistent with the rest of the app.
2. Same block/hero patterns where applicable; post-specific components (e.g. views, comments) compose under the page.

**Authenticated / custom site APIs (`src/app/(frontend)/api/**`):**

1. `route.ts` handlers run on the Edge/Node runtime as configured per file.
2. Handlers use `getPayload`, cookies/headers, and return `Response.json` or redirects (e.g. Google OAuth under `api/auth/google/`, comments under `api/site-comments/`).

**Payload admin & REST/GraphQL:**

1. Admin UI: `src/app/(payload)/admin/[[...segments]]/page.tsx` loads Payload’s admin bundle; `importMap.js` is generated for component resolution.
2. REST: `src/app/(payload)/api/[...slug]/route.ts` re-exports Payload REST handlers (`REST_GET`, etc.) bound to `config`.
3. GraphQL: `src/app/(payload)/api/graphql/route.ts` and optional playground route.

**State Management:**

- Server: Request-scoped; no global mutable server state. Document/global reads may use `unstable_cache` with tags (see `src/utilities/getDocument.ts`, `src/utilities/getGlobals.ts`).
- Client: React context via `src/providers/index.tsx` (theme, query client, auth).
- Persistence: PostgreSQL as the system of record; JWT/session behavior follows Payload + custom routes as implemented.

## Key Abstractions

**Block registry (`RenderBlocks`):**
- Purpose: Single map from CMS `blockType` to React component for page `layout` arrays.
- Examples: `src/blocks/RenderBlocks.tsx`, block folders under `src/blocks/*/Component.tsx`
- Pattern: Discriminated union by `blockType`; unknown types fall through safely.

**Hero registry (`RenderHero`):**
- Purpose: Same idea for page/post hero variants.
- Examples: `src/heros/RenderHero.tsx`, `src/heros/*`

**Cached document/global accessors:**
- Purpose: Stable cache keys and tags for ISR-style revalidation tied to slugs/collections.
- Examples: `src/utilities/getDocument.ts` (`getCachedDocument`), `src/utilities/getGlobals.ts` (`getCachedGlobal`)

**Access helpers:**
- Purpose: Reusable collection- and field-level access predicates.
- Examples: `src/access/authenticated.ts`, `src/access/adminOnly.ts`, `src/access/authenticatedOrPublished.ts`

**Payload config as hub:**
- Purpose: Single `buildConfig` export wiring DB, collections, globals, i18n, jobs, admin UI, and plugins.
- Examples: `src/payload.config.ts`

## Entry Points

**Next.js application:**
- Location: `next.config.js` (wrapped with `withPayload` from `@payloadcms/next/withPayload`)
- Triggers: `pnpm dev`, `pnpm build`, `pnpm start` (see `package.json`)
- Responsibilities: Build, image config, redirects from `redirects.js`, Payload bundling integration.

**Public site shell:**
- Location: `src/app/(frontend)/layout.tsx`
- Triggers: All `(frontend)` routes
- Responsibilities: Fonts, theme init, `Providers`, `Header`/`Footer`, `AdminBar`, favicon from `general-settings` global.

**Dynamic CMS pages:**
- Location: `src/app/(frontend)/[slug]/page.tsx`, `src/app/(frontend)/posts/[slug]/page.tsx`, `src/app/(frontend)/categories/[slug]/page.tsx`, etc.
- Triggers: HTTP GET for matching paths
- Responsibilities: Load Payload documents, render heroes/blocks, set metadata.

**Payload REST API:**
- Location: `src/app/(payload)/api/[...slug]/route.ts`
- Triggers: HTTP verbs to `/api/*` as routed by Payload
- Responsibilities: CRUD and auth for collections/globals per Payload rules.

**Custom frontend API routes:**
- Location: `src/app/(frontend)/api/*/route.ts` (posts, auth, geo-ip, site-comments, etc.)
- Triggers: Fetch/XHR from client components or external callers
- Responsibilities: Domain-specific operations without exposing full admin API.

**Payload config module:**
- Location: `src/payload.config.ts`
- Triggers: Import from `@payload-config` anywhere on the server
- Responsibilities: Entire CMS configuration.

## Error Handling

**Strategy:** Failures in Server Components surface as Next.js error boundaries / default error UI; route handlers return HTTP status codes and JSON bodies; Payload throws `APIError` for API-layer validation and auth failures.

**Patterns:**
- Route handlers: explicit `Response.json(..., { status })` for client-consumable errors.
- Local API: callers are responsible for try/catch where needed; collection hooks should pass `req` for transactional nested operations (project convention per `AGENTS.md`).
- Build-time: `generateStaticParams` may return `[]` in development to avoid repeated DB work (see `src/app/(frontend)/[slug]/page.tsx`).

## Cross-Cutting Concerns

**Logging:** No dedicated logging SDK detected in reviewed paths; server code may use `console` or rely on platform logs.

**Validation:** Payload field validation and hooks on write paths; API routes validate inputs before calling `payload.create`/`update` as implemented per route.

**Authentication:** Payload `users` collection with roles; site-specific auth flows under `src/app/(frontend)/api/auth/`; access predicates in `src/access/`. Local API usage must respect `overrideAccess` when enforcing user permissions (see project rules in `AGENTS.md`).

**Internationalization:** Payload `i18n` with `en` and `vi` in `src/payload.config.ts`; public layout sets `lang="vi"` on `<html>`.

**Preview & drafts:** `draftMode` from `next/headers` in layouts/pages; live preview listener components for editor workflows.

**Search & SEO:** `seoPlugin`, `searchPlugin`, redirects and nested docs configured in `src/plugins/index.ts`; metadata merged in layouts via `mergeOpenGraph`.

---

*Architecture analysis: 2026-04-19*
