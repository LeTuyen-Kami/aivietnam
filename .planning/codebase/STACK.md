# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.7.3 — Application code in `src/`, tests, scripts; `tsconfig.json` targets ES2022, strict mode, `moduleResolution: bundler`.

**Secondary:**
- JavaScript — Config and tooling: `next.config.js`, `redirects.js`, `postcss.config.js`, `next-sitemap.config.cjs`, ESLint flat config `eslint.config.mjs`.

## Runtime

**Environment:**
- Node.js — `package.json` `engines`: `^18.20.2 || >=20.9.0`.

**Package Manager:**
- pnpm — `engines` require `^9 || ^10`; lockfile `pnpm-lock.yaml` at repo root.
- Bun — Used for some maintenance scripts only (`seed`, `seed:footer`, `seed:media`, `migrate:admin-roles` in `package.json` via `bun run`); not declared in `engines`.

## Frameworks

**Core:**
- Next.js 15.4.11 — App Router (`src/app/`), API routes, `next dev --turbopack` (`package.json` `dev`).
- React 19.2.1 — UI with Server Components by default; client components where `'use client'` is used.
- Payload CMS 3.79.1 — Headless CMS and admin UI; config `src/payload.config.ts`; Next integration via `@payloadcms/next` and `withPayload` in `next.config.js`.

**Testing:**
- Vitest 4.0.18 — Integration-style tests in `tests/int/`, config `vitest.config.mts`, `jsdom`, setup `vitest.setup.ts`.
- Playwright 1.58.2 — E2E in `tests/e2e/`, config `playwright.config.ts` (Chromium project, optional `pnpm dev` webServer).
- Testing Library — `@testing-library/react` for component tests with Vitest.

**Build/Dev:**
- TypeScript 5.7.3 — `noEmit` typecheck; Next handles compilation.
- ESLint 9.x — `eslint.config.mjs`, extends `next/core-web-vitals` and `next/typescript`.
- Prettier 3.x — `/.prettierrc.json` (single quotes, trailing commas, print width 100, no semicolons).
- Tailwind CSS 4.2.x — `@tailwindcss/postcss`, `tailwind.config.mjs`, global styles `src/app/(frontend)/globals.css`.
- PostCSS — `postcss.config.js` with Tailwind/Autoprefixer.
- next-sitemap 4.x — Post-build sitemap (`postbuild` in `package.json`), `next-sitemap.config.cjs`.
- tsx — Script execution and Playwright loader (`NODE_OPTIONS` in test scripts).

## Key Dependencies

**Critical:**
- `payload` / `@payloadcms/next` — CMS core, admin, REST/GraphQL routes under `src/app/(payload)/`.
- `@payloadcms/db-postgres` — PostgreSQL adapter; pool uses `DATABASE_URL` in `src/payload.config.ts`.
- `@payloadcms/richtext-lexical` / `lexicalEditor` — Rich text across collections and plugins.
- `sharp` — Image processing for uploads and sizes (`src/payload.config.ts`, `src/collections/Media.ts`).
- `next` / `react` / `react-dom` — Frontend and SSR.

**Infrastructure:**
- `pg` (devDependency) — PostgreSQL client used with the stack (adapter layer).
- `@tanstack/react-query` — Client-side data fetching where used in React components.
- `google-auth-library` — Google OAuth token exchange for frontend auth routes (`src/app/(frontend)/api/auth/google/`).
- `graphql` — Pulled in for Payload’s GraphQL API (`src/app/(payload)/api/graphql/route.ts`).

**Payload plugins (from `src/plugins/index.ts`):**
- `@payloadcms/plugin-redirects`, `@payloadcms/plugin-nested-docs`, `@payloadcms/plugin-seo`, `@payloadcms/plugin-form-builder`, `@payloadcms/plugin-search`, `@payloadcms/plugin-mcp`.

**UI primitives:**
- Radix UI packages, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `motion` — Component styling and animation; project aliases align with shadcn-style setup (`components.json`).

## Configuration

**Environment:**
- Variables documented in `.env.example` (do not commit secrets): `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`, optional `IPGEOLOCATION_API_KEY`, optional Google OAuth trio.
- Type augmentation for selected vars in `src/environment.d.ts`.

**Build:**
- `next.config.js` — `withPayload`, image `remotePatterns` from server URL, `redirects.js`.
- `tsconfig.json` — Path aliases `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts`.
- `next-sitemap.config.cjs` — Site URL from env for sitemaps/robots.

## Platform Requirements

**Development:**
- Node.js matching `engines`; pnpm for installs per `package.json`.
- PostgreSQL reachable via `DATABASE_URL` (MongoDB string in `.env.example` is template legacy; active adapter is Postgres in `src/payload.config.ts`).

**Production:**
- Typical target: Node hosting compatible with Next.js 15 (e.g. Vercel — `VERCEL_PROJECT_PRODUCTION_URL` and cron/job patterns referenced in `next.config.js`, `src/utilities/getURL.ts`, `src/payload.config.ts`).

---

*Stack analysis: 2026-04-19*
