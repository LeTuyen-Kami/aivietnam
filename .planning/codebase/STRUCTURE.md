# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
aivietnam/
├── public/                 # Static assets served as-is
├── scripts/                # Operational TS scripts (seed, migrate, fixes); run via bun
├── src/                    # Application source (Next.js + Payload)
│   ├── app/
│   │   ├── (frontend)/     # Public site: layouts, pages, route handlers, global CSS
│   │   └── (payload)/      # Admin UI, Payload REST/GraphQL, generated import map
│   ├── access/             # Reusable Payload access functions and auth helpers
│   ├── blocks/             # CMS layout blocks (config + Component.tsx per block)
│   ├── collections/        # Payload collection configs + hooks
│   ├── components/         # Shared React components (UI, Auth, CMS helpers)
│   ├── endpoints/          # Seed payloads and related endpoint helpers
│   ├── fields/             # Shared field configs (Lexical, link, etc.)
│   ├── Footer/             # Footer global: config + Component + hooks
│   ├── GeneralSettings/    # General settings global: config + hooks
│   ├── Header/             # Header global: config + Component + hooks
│   ├── heros/              # Page hero variants + RenderHero
│   ├── hooks/              # Shared Payload hooks (revalidation, publishedAt, …)
│   ├── plugins/            # Payload plugins assembly
│   ├── providers/          # React context providers (theme, auth, query)
│   ├── search/             # Search plugin field overrides and sync hooks
│   ├── utilities/          # Helpers (URLs, cache, metadata, UI cn)
│   ├── payload.config.ts   # Payload buildConfig entry
│   └── payload-types.ts    # Generated types (pnpm run generate:types)
├── tests/                  # Vitest + Playwright tests
├── next.config.js          # Next + withPayload wrapper
├── tsconfig.json           # Paths: @/*, @payload-config
├── package.json
├── playwright.config.ts
├── vitest.config.mts
├── Dockerfile
├── docker-compose.yml
└── redirects.js            # Next redirects; imported by next.config.js
```

## Directory Purposes

**`src/app/(frontend)/`:**
- Purpose: Public-facing Next.js routes and layouts.
- Contains: `layout.tsx`, `globals.css`, dynamic routes (`[slug]`, `posts`, `categories`, `search`), `api/` Route Handlers for site-specific JSON endpoints, sitemap route groups under `(sitemaps)/`.
- Key files: `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx`, `src/app/(frontend)/[slug]/page.tsx`, `src/app/(frontend)/posts/[slug]/page.tsx`

**`src/app/(payload)/`:**
- Purpose: Payload admin app shell and first-party CMS APIs.
- Contains: `admin/` catch-all, `api/[...slug]/route.ts` (REST), `api/graphql/route.ts`, `admin/importMap.js` (generated).
- Key files: `src/app/(payload)/layout.tsx` (do not hand-edit; generator-owned comment in file)

**`src/collections/`:**
- Purpose: One folder or file per collection; exports `CollectionConfig`.
- Contains: `Pages/`, `Posts/`, `Comments/`, nested `hooks/` for collection-specific behavior.
- Key files: `src/collections/Pages/index.ts`, `src/collections/Posts/index.ts`, `src/collections/Users/index.ts`

**`src/blocks/`:**
- Purpose: Visual blocks referenced from `pages` layout field; each block usually has `Component.tsx` and optional subcomponents.
- Contains: Block folders (`Content`, `CallToAction`, `Form`, …), `RenderBlocks.tsx` registry.
- Key files: `src/blocks/RenderBlocks.tsx`

**`src/components/`:**
- Purpose: Reusable UI and feature components not tied to a single block (AdminBar, Link, RichText, Auth, etc.).
- Contains: PascalCase component folders/files per feature.
- Key files: `src/components/Link/index.tsx`, `src/components/SmartLink/index.tsx`

**`src/fields/`:**
- Purpose: DRY field definitions shared across collections/globals.
- Contains: `defaultLexical`, link field, slug helpers — see `src/fields/`

**`src/access/`:**
- Purpose: Access control predicates and helpers (`isAdminUser`, `siteMemberUser`, etc.).
- Key files: `src/access/isAdminUser.ts`, `src/access/siteMemberUser.ts`

**`src/utilities/`:**
- Purpose: Non-UI helpers: `getGlobals`, `getURL`, `generateMeta`, `mergeOpenGraph`, `ui` (cn).
- Key files: `src/utilities/getGlobals.ts`, `src/utilities/getURL.ts`

**`src/providers/`:**
- Purpose: Client-side context composition for the frontend tree.
- Key files: `src/providers/index.tsx`

**`src/plugins/`:**
- Purpose: Compose Payload plugins (SEO, search, redirects, nested docs, form builder, MCP).
- Key files: `src/plugins/index.ts`

**`src/endpoints/`:**
- Purpose: Seed data and static fallbacks used during development or seed routes.
- Key files: `src/endpoints/seed/home-static` (imported from `[slug]/page.tsx`)

**`scripts/`:**
- Purpose: One-off maintenance, seeding, migrations — executed with `bun run` per `package.json`.
- Contains: `seed.ts`, `migrate-users-to-admin.ts`, etc.

**`tests/`:**
- Purpose: Vitest integration/unit tests and Playwright E2E configuration consumes `tests/e2e` or similar — verify with `playwright.config.ts` and `vitest.config.mts`.

## Key File Locations

**Entry Points:**
- `package.json` (`dev`, `build`, `start`): Next.js lifecycle commands
- `src/app/(frontend)/layout.tsx`: Root HTML shell for the public site
- `src/app/(frontend)/page.tsx`: Home page — re-exports `./[slug]/page`
- `src/app/(payload)/admin/[[...segments]]/`: Admin SPA entry
- `src/app/(payload)/api/[...slug]/route.ts`: Payload REST API surface

**Configuration:**
- `src/payload.config.ts`: CMS database, collections, globals, plugins, i18n, jobs
- `next.config.js`: Next + `withPayload`, image remote patterns, `redirects.js`
- `tsconfig.json`: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`
- `tailwind.config.mjs`, `postcss.config.js`: styling pipeline
- `eslint.config.mjs`, `.prettierrc.json`: lint and format
- `.env` / `.env.example`: environment templates (do not commit secrets; never paste `.env` contents into docs)

**Core Logic:**
- `src/collections/**`: Schema and hooks
- `src/blocks/**`, `src/heros/**`: Presentation mapping for CMS data
- `src/app/(frontend)/api/**/route.ts`: Custom HTTP APIs for the product

**Testing:**
- `vitest.config.mts`, `playwright.config.ts`, `tests/**`

## Naming Conventions

**Files:**
- **Route segments**: Next convention — `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx` if present
- **React components**: `PascalCase.tsx` for components; often `Component.tsx` inside a block folder
- **Registry / single-purpose**: `RenderBlocks.tsx`, `RenderHero.tsx`
- **Config modules**: `index.ts` in collection folders exports the collection; globals use `config.ts` in `Header/`, `Footer/`, `GeneralSettings/`
- **Utilities**: `camelCase.ts` in `src/utilities/`
- **Tests**: `*.test.ts` or `*.spec.ts` per Vitest; E2E under `tests/` per Playwright

**Directories:**
- **Feature folders**: PascalCase for `blocks/ArchiveBlock`, `heros/PostHero`, `components/Auth`
- **App routes**: Next conventions — dynamic `[slug]`, grouped `(frontend)`, `(payload)`

**Special Patterns:**
- **Path alias `@/`**: Always prefer `@/...` imports for `src/` (see `tsconfig.json`)
- **`@payload-config`**: Import Payload config without deep relative paths
- **Generated**: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` — regenerate after schema or admin component path changes (`pnpm run generate:types`, `pnpm run generate:importmap`)

## Where to Add New Code

**New CMS collection:**
- Implementation: `src/collections/<Name>/index.ts` (or `<Name>.ts` if single-file)
- Register: add import and entry in `collections: [...]` in `src/payload.config.ts`
- Types: run `pnpm run generate:types` (from `package.json`)
- Access: add or reuse functions in `src/access/`

**New global:**
- Implementation: `src/<GlobalName>/config.ts` pattern (see `src/Header/config.ts`) + optional `Component.tsx` if rendered on site
- Register: add to `globals: [...]` in `src/payload.config.ts`
- Frontend read: extend `getCachedGlobal` usage with new slug in `src/utilities/getGlobals.ts` types (keyof `Config['globals']`)

**New layout block:**
- Block folder: `src/blocks/<BlockName>/Component.tsx` (+ styles if needed)
- Schema: add block to `pages` (or relevant collection) `blocks` field in `src/collections/Pages/index.ts`
- Registry: add mapping in `src/blocks/RenderBlocks.tsx`
- Types: `pnpm run generate:types`

**New public page route:**
- Implementation: new folder under `src/app/(frontend)/` with `page.tsx`; use `generateMetadata` as needed
- Data: call `getPayload` from server or use existing utilities

**New custom API (JSON):**
- Implementation: `src/app/(frontend)/api/<feature>/route.ts` exporting `GET`/`POST`/etc.
- Auth: use `src/access/` and Payload `getPayload`; enforce `overrideAccess: false` when simulating user context

**New shared hook (CMS lifecycle):**
- Collection-specific: `src/collections/<Collection>/hooks/<name>.ts`
- Global-specific: `src/Header/hooks/`, `src/Footer/hooks/`, `src/GeneralSettings/hooks/`
- Shared across collections: `src/hooks/`

**Utilities:**
- Shared helpers: `src/utilities/<descriptiveName>.ts`

**Tests:**
- Unit/integration: co-locate or place under `tests/` per existing Vitest layout
- E2E: `tests/` with Playwright, aligned with `playwright.config.ts`

## Special Directories

**`src/app/(payload)/admin/importMap.js`:**
- Purpose: Resolves string component paths from Payload config to actual modules
- Generated: Yes — `pnpm run generate:importmap`
- Committed: Typically yes; regen after admin component path changes

**`src/payload-types.ts`:**
- Purpose: TypeScript types for collections, globals, and blocks
- Generated: Yes — `pnpm run generate:types`
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No (gitignored)

**`node_modules/`:**
- Purpose: Dependencies
- Committed: No

---

*Structure analysis: 2026-04-19*
