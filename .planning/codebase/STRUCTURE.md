# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
aivietnam/
├── public/                 # Static assets served as-is
├── scripts/                # Maintenance and seed scripts (e.g. bun/tsx)
├── tests/                  # Vitest integration + Playwright e2e + helpers
├── src/                    # Application source (Next.js + Payload)
│   ├── app/                # App Router: frontend routes, Payload admin, APIs
│   ├── access/             # Payload access control helpers
│   ├── blocks/             # Layout block configs + frontend Components + RenderBlocks
│   ├── collections/      # Payload collection definitions and hooks
│   ├── components/         # Shared React components (ui, auth, media, etc.)
│   ├── endpoints/          # Seed/static payloads used by routes
│   ├── fields/             # Reusable Payload field factories (link, lexical defaults)
│   ├── Footer/             # Footer global: config + Component + hooks
│   ├── GeneralSettings/    # General settings global + hooks
│   ├── Header/             # Header global: config + Nav + Component
│   ├── heros/              # Hero variants + RenderHero
│   ├── hooks/              # Shared Payload hooks (e.g. revalidate, publishedAt)
│   ├── plugins/            # Payload plugins assembly
│   ├── providers/          # React context (theme, auth, query)
│   ├── search/             # Search plugin overrides and sync hooks
│   ├── utilities/          # Helpers (cache, URLs, meta, UI)
│   ├── payload.config.ts   # Payload buildConfig entry
│   └── payload-types.ts    # Generated types (run generate:types)
├── next.config.js          # Next + Payload wrapper, redirects, images
├── tsconfig.json           # Paths: @/* → src/*, @payload-config
├── package.json            # Scripts and dependencies
├── playwright.config.ts    # E2E config
├── vitest.config.mts       # Integration/unit Vitest config
└── Dockerfile              # Container build (if used)
```

## Directory Purposes

**`src/app/(frontend)/`:**
- Purpose: Public website — pages, client bundles where needed, and first-party REST routes under `api/`.
- Contains: `layout.tsx`, `page.tsx`, `*.client.tsx`, `route.ts` for APIs, preview, sitemaps, `globals.css`.
- Key files: `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/[slug]/page.tsx`, `src/app/(frontend)/posts/[slug]/page.tsx`

**`src/app/(payload)/`:**
- Purpose: Payload admin UI and official REST/GraphQL API routes.
- Contains: `admin/[[...segments]]/`, `api/[...slug]/route.ts`, `api/graphql/`, generated `admin/importMap.js`.
- Key files: `src/app/(payload)/api/[...slug]/route.ts`, `src/app/(payload)/layout.tsx`

**`src/collections/`:**
- Purpose: One folder or file per collection (`Pages/`, `Posts/`, `Users/index.ts`, etc.) with optional `hooks/` subfolders.
- Contains: `CollectionConfig` exports, hooks for revalidation, population, moderation.

**`src/blocks/`:**
- Purpose: CMS blocks — typically `Config.ts` or field slices in parent collections plus a `Component.tsx` per block; `RenderBlocks.tsx` maps slugs to components.
- Contains: Feature folders (`Content/`, `Form/`, `MediaBlock/`, …).

**`src/components/`:**
- Purpose: Reusable UI not tied to a single block (e.g. `Link/`, `SmartLink/`, `Media/`, `Auth/`, shadcn-style `ui/`).
- Contains: PascalCase component folders; shared primitives.

**`src/heros/`:**
- Purpose: Page/post hero layouts; `RenderHero.tsx` dispatches by hero type.

**`src/access/`:**
- Purpose: Named access predicates imported by collection/global configs.

**`src/fields/`:**
- Purpose: DRY field definitions (`link.ts`, `linkGroup.ts`, `defaultLexical.ts`).

**`src/utilities/`:**
- Purpose: Server and shared helpers — caching, metadata, URLs, small hooks like `useDebounce.ts`.

**`src/plugins/`:**
- Purpose: `plugins/index.ts` exports the `plugins` array for `payload.config.ts`.

**`src/providers/`:**
- Purpose: Client providers composed in `src/providers/index.tsx` and used from the frontend layout.

**`src/search/`:**
- Purpose: Search plugin customization (`fieldOverrides.ts`, `beforeSync.ts`, `Component.tsx`).

**`src/endpoints/`:**
- Purpose: Seed content and related helpers consumed by app routes (e.g. `src/endpoints/seed/`).

**`Header/`, `Footer/`, `GeneralSettings/`:**
- Purpose: Globals co-located with their React `Component` and `config.ts` for Payload `globals` registration.

**`public/`:**
- Purpose: Favicon fallbacks, static files not from Payload media.

**`scripts/`:**
- Purpose: Operational scripts (seeding, migrations) invoked via `package.json` scripts.

**`tests/`:**
- Purpose: `int/` for Vitest, `e2e/` for Playwright, `helpers/` for shared test utilities.

## Key File Locations

**Entry Points:**
- `next.config.js`: Next.js + Payload integration
- `src/payload.config.ts`: CMS configuration (`@payload-config`)
- `src/app/(frontend)/layout.tsx`: Public HTML shell and global chrome
- `src/app/(payload)/admin/[[...segments]]/page.tsx`: Admin SPA shell

**Configuration:**
- `tsconfig.json`: Path aliases `@/*`, `@payload-config`
- `eslint.config.mjs`, `.prettierrc.json`: Lint and format
- `tailwind.config.mjs`, `postcss.config.js`, `src/app/(frontend)/globals.css`: Styling pipeline
- `playwright.config.ts`, `vitest.config.mts`: Test runners
- `.env` / `.env.example`: Environment (existence only; do not commit secrets)

**Core Logic:**
- `src/collections/*`: Content model and hooks
- `src/blocks/RenderBlocks.tsx`, `src/heros/RenderHero.tsx`: CMS → React dispatch
- `src/utilities/getDocument.ts`, `src/utilities/getGlobals.ts`: Data loading and cache tags

**Testing:**
- `tests/int/api.int.spec.ts`: API integration tests
- `tests/e2e/*.spec.ts`: Browser e2e
- `tests/helpers/*.ts`: Login and seed helpers

## Naming Conventions

**Files:**
- `page.tsx`, `layout.tsx`, `route.ts`: Next.js App Router conventions under `src/app/`
- `*.client.tsx`: Client boundary split from Server Components
- Collection configs: `index.ts` inside `src/collections/<Name>/` or `src/collections/<Name>.ts`
- PascalCase folders for React components (`src/components/Media/`, `src/blocks/Content/`)
- `Component.tsx`: Common filename for the main export inside a feature folder (Header, Footer, blocks)

**Directories:**
- Route groups use parentheses: `(frontend)`, `(payload)`, `(sitemaps)`
- Plural route segments match features: `posts/`, `categories/`
- Kebab-case for global slugs in CMS (`general-settings`) matching Payload globals

**Special Patterns:**
- `@/` imports map to `src/` per `tsconfig.json`
- `@payload-config` resolves to `src/payload.config.ts`
- Generated: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` (regenerate after admin component or schema changes)

## Where to Add New Code

**New CMS collection:**
- Implementation: `src/collections/<CollectionName>/index.ts` (or single file)
- Access: reuse or add predicates under `src/access/`
- Register: import and append to `collections` in `src/payload.config.ts`
- Types: run `pnpm generate:types` (project script)

**New global:**
- Implementation: `src/<GlobalName>/config.ts` + optional `Component` at repo root pattern used by `Header`, `Footer`, `GeneralSettings`
- Register: add to `globals` in `src/payload.config.ts`

**New layout block:**
- Block folder: `src/blocks/<BlockName>/` with `Component.tsx` (and config/fields as needed)
- Registry: add `blockType` → component in `src/blocks/RenderBlocks.tsx`
- Schema: extend `pages` (or relevant collection) `layout` blocks array to include the new block slug

**New public page route:**
- Implementation: `src/app/(frontend)/<segment>/page.tsx`
- Shared chrome: automatic via `src/app/(frontend)/layout.tsx`

**New site-specific HTTP API:**
- Implementation: `src/app/(frontend)/api/<name>/route.ts`
- Prefer Payload access checks and consistent JSON error shapes

**New shared UI:**
- Implementation: `src/components/<Name>/` or `src/components/ui/` for primitives

**Utilities:**
- Shared helpers: `src/utilities/<name>.ts`

**Tests:**
- Integration: `tests/int/` with Vitest config `vitest.config.mts`
- E2E: `tests/e2e/` with Playwright

## Special Directories

**`src/app/(payload)/admin/importMap.js`:**
- Purpose: Resolves string component paths from Payload config to actual imports for the admin UI
- Source: Auto-generated (`pnpm generate:importmap`)
- Committed: Yes (typical for Payload 3 templates); regenerate when admin components change

**`src/payload-types.ts`:**
- Purpose: TypeScript types for collections, globals, and blocks
- Source: `pnpm generate:types`
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Committed: No (should be gitignored)

---

*Structure analysis: 2026-04-19*
