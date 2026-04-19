# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.7.3 — Application code under `src/`, configs typed via `tsconfig.json`

**Secondary:**
- JavaScript — `next.config.js`, `redirects.js`, `next-sitemap.config.cjs`, PostCSS config
- SCSS/CSS — Global styles in `src/app/(frontend)/globals.css` (Tailwind v4 pipeline)

## Runtime

**Environment:**
- Node.js — `^18.20.2 || >=20.9.0` per `package.json` `engines`
- Next.js runs the app; `NODE_OPTIONS=--no-deprecation` set in npm scripts

**Package Manager:**
- pnpm — `^9 || ^10` per `package.json` `engines`
- Lockfile: `pnpm-lock.yaml` present
- **Note:** Some scripts invoke `bun run` for one-off tooling (`scripts/seed.ts`, `scripts/seed-footer.ts`, etc. in `package.json`); primary install and test commands use pnpm

## Frameworks

**Core:**
- Next.js 15.4.11 — App Router under `src/app/`; `next.config.js` wraps config with `withPayload` from `@payloadcms/next/withPayload`
- React 19.2.1 — UI and Payload admin
- Payload CMS 3.79.1 — Headless CMS, config in `src/payload.config.ts`

**Testing:**
- Vitest 4.0.18 — Integration tests in `tests/int/**/*.int.spec.ts`, config `vitest.config.mts`, setup `vitest.setup.ts`
- Playwright 1.58.2 — E2E in `tests/e2e/`, config `playwright.config.ts` (uses `dotenv/config`, `pnpm dev` as web server)
- Testing Library React 16.3.0 — Component testing support via Vitest/jsdom

**Build/Dev:**
- TypeScript 5.7.3 — `tsconfig.json` (`strict`, `moduleResolution: bundler`, path aliases `@/*`, `@payload-config`)
- Tailwind CSS 4.2.2 — `@tailwindcss/postcss` in `postcss.config.js`
- tsx 4.21.0 — TypeScript execution for scripts and Playwright `NODE_OPTIONS`
- next-sitemap 4.2.3 — Post-build sitemap (`postbuild` in `package.json`), config `next-sitemap.config.cjs`

## Key Dependencies

**Critical:**
- `payload` 3.79.1 — CMS core; collections, globals, jobs config in `src/payload.config.ts`
- `@payloadcms/db-postgres` 3.79.1 — PostgreSQL adapter (`postgresAdapter` in `src/payload.config.ts`)
- `@payloadcms/next` 3.79.1 — Next.js integration and route handlers
- `next` 15.4.11 — Framework and routing
- `react` / `react-dom` 19.2.1 — UI layer
- `sharp` 0.34.2 — Image processing (passed to Payload `buildConfig` in `src/payload.config.ts`)

**Payload plugins & UI (representative):**
- `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects`, `@payloadcms/plugin-search`, `@payloadcms/plugin-form-builder`, `@payloadcms/plugin-nested-docs`, `@payloadcms/plugin-mcp`, `@payloadcms/live-preview-react` — Registered in `src/plugins/index.ts`
- `@tanstack/react-query` ^5.x — Client data fetching where used in frontend components

**Infrastructure:**
- `pg` ^8.20.0 (devDependency) — PostgreSQL client; used with Payload Postgres adapter
- `dotenv` 16.4.7 — Loaded by Playwright config and typical local tooling

## Configuration

**Environment:**
- Local and deployment settings via environment variables (see `.env.example` for names; do not commit secrets)
- Declared typings for common vars in `src/environment.d.ts`

**Build:**
- `next.config.js` — `withPayload`, image `remotePatterns`, `redirects` from `redirects.js`, webpack `extensionAlias`
- `tsconfig.json` — Compiler and path aliases
- `eslint.config.mjs` — Flat config, extends `next/core-web-vitals`, `next/typescript`
- `.prettierrc.json` — Formatting

## Platform Requirements

**Development:**
- Node.js matching `engines`; pnpm for install and scripts
- PostgreSQL reachable via `DATABASE_URL` (Payload Postgres adapter; `.env.example` shows Mongo example string but `src/payload.config.ts` uses `postgresAdapter`)

**Production:**
- Node-compatible host (commonly Vercel for Next.js; `VERCEL_PROJECT_PRODUCTION_URL` referenced in `src/utilities/getURL.ts` and `next.config.js` for URL resolution)
- Build: `pnpm build` (`cross-env NODE_OPTIONS=--no-deprecation next build`); `postbuild` runs `next-sitemap`

---

*Stack analysis: 2026-04-19*
