# Codebase Concerns

**Analysis Date:** 2026-04-19

## Tech Debt

**SEO and branding still use Payload template defaults:**
- Issue: `generateTitle` in `src/plugins/index.ts` appends `| Payload Website Template` and falls back to that string; Playwright `tests/e2e/frontend.e2e.spec.ts` asserts the same homepage title and `h1`.
- Impact: Rebranding breaks e2e until titles and tests are updated; live SEO metadata can ship wrong brand.
- Fix approach: Centralize site name (for example from `general-settings` or env) in `generateTitle` / `generateURL`, then align `tests/e2e/frontend.e2e.spec.ts` with the real product name.

**Duplicate comment visibility rules in API vs collection access:**
- Issue: `src/app/(frontend)/api/site-comments/route.ts` builds `Where` clauses and uses `overrideAccess: true` on `payload.find` while mirroring logic from `src/collections/Comments/index.ts` (`read` access and member vs guest behavior).
- Impact: If `Comments` access rules change, the route can drift and leak or hide comments incorrectly until caught manually.
- Fix approach: Prefer a single source of truth (shared helper that takes `user` and returns `Where`, or a small internal function used by both the route and tests).

**TypeScript escape hatches in UI and plugins:**
- Issue: `@ts-expect-error` in `src/blocks/RenderBlocks.tsx` (block render typing), `src/plugins/index.ts` (redirects plugin field override), `@typescript-eslint/no-explicit-any` in `src/blocks/Form/Component.tsx` (`React.FC<any>` for dynamic fields), and `eslint-disable` for `payload-types.ts` generation.
- Impact: Refactors skip compiler help; plugin upgrades can fail silently until runtime.
- Fix approach: Tighten block and form field types with Payload’s generated unions where possible; regenerate types after schema changes (`pnpm run generate:types`).

**Seed script comments vs package manager:**
- Issue: `src/endpoints/seed/index.ts` comments refer to `yarn seed`; root scripts use `pnpm` / `bun run` for `seed` (`package.json`).
- Impact: Onboarding confusion only.
- Fix approach: Update comments to match `package.json` scripts.

## Known Bugs

**Not verified in this audit:** No reproducible application bug was confirmed by execution. Treat items below as risk areas, not filed bugs.

**E2E homepage assertions may fail after content changes:**
- Symptoms: Playwright fails when default page title or hero copy changes.
- Trigger: Edit homepage or global SEO so `h1` / `<title>` no longer match `tests/e2e/frontend.e2e.spec.ts`.
- Workaround: Update test expectations when marketing copy changes.
- Root cause: Tests hard-code template strings instead of data-driven checks.

## Security Considerations

**`/next/seed` allows destructive reseed for any authenticated user:**
- Risk: `POST` to `src/app/(frontend)/next/seed/route.ts` only checks `if (!user)`; `seed` in `src/endpoints/seed/index.ts` clears collections and globals (see `COLLECTIONS_CLEAR_ORDER` and `payload.db.deleteMany`).
- Current mitigation: None in route beyond “must be logged in.”
- Recommendations: Restrict to admin role (reuse `isUsersCollectionAdmin` from `src/access/isAdminUser.ts`), or disable the route in production via env (for example require `ALLOW_SEED_ENDPOINT=true` and `NODE_ENV !== 'production'`), or remove the HTTP route and keep only CLI `scripts/seed.ts`.

**Public user registration:**
- Risk: `Users` collection has `create: () => true` in `src/collections/Users/index.ts`; `beforeValidate` forces `member` role for non-admin creates.
- Current mitigation: Role cannot self-escalate via `roles` field access rules.
- Recommendations: If open signup is unintended, set `create` to admin-only or add invite-only flow.

**Google OAuth callback uses `overrideAccess: true` for user CRUD and login:**
- Risk: Elevated Local API use in `src/app/(frontend)/api/auth/google/callback/route.ts` (find/update/create/login). Wrong changes could widen account takeover surface.
- Current mitigation: Flow uses Google `sub` / verified email; `email_linked` guard when email exists with different `googleSub`.
- Recommendations: Keep this file small; add tests for linking edge cases; do not add new `overrideAccess` calls without review.

**Geo IP endpoint (`/api/geo-ip`):**
- Risk: `GET` in `src/app/(frontend)/api/geo-ip/route.ts` accepts `?ip=` for arbitrary public IPs when `isPublicRoutableIp` passes; can burn third-party API quotas (`IPGEOLOCATION_API_KEY` or ip-api fallback) or be used as a lightweight open proxy for geolocation.
- Current mitigation: Validates routable IP shape; no auth.
- Recommendations: Rate limit (middleware or edge), require auth for `?ip=`, or restrict to server-side callers only.

**View counter cookie bypass:**
- Risk: `src/app/(frontend)/api/posts/[id]/increment-views/route.ts` uses per-post `httpOnly` cookie to dedupe; clearing cookies or new clients increments again.
- Current mitigation: Cookie dedupe for one day per browser.
- Recommendations: Accept as soft metric or add server-side dedupe (hashed IP + post id window) if abuse matters.

**Theme init script (`dangerouslySetInnerHTML`):**
- Risk: `src/providers/Theme/InitTheme/index.tsx` injects a small IIFE; content is static and uses `defaultTheme` / `themeLocalStorageKey` from code, not user input.
- Current mitigation: No user-controlled strings in the script body.
- Recommendations: Keep it that way; never interpolate untrusted data into this block.

## Performance Bottlenecks

**Post detail page parallel data loading:**
- Problem: `src/app/(frontend)/posts/[slug]/page.tsx` awaits `Promise.all` across `queryPostBySlug`, sidebar posts, form, categories, and defaults — multiple Postgres round-trips per request.
- Measurement: Not measured in this audit (no p95 numbers).
- Cause: Multiple independent Payload `find` calls.
- Improvement path: Combine where possible with `select`/`depth` tuning, or cache globals (`querySidebarForm`, categories) with `unstable_cache` / tags, depending on freshness needs.

**Static params generation cap:**
- Problem: `generateStaticParams` in the same file uses `limit: 1000` for posts; slugs beyond that are not prebuilt at build time.
- Cause: Fixed limit in `payload.find`.
- Improvement path: Pagination for build, or ISR-only strategy with explicit policy for large archives.

**Geo IP route external HTTP:**
- Problem: Each `GET` may call `api.ipgeolocation.io` or `ip-api.com` (`src/app/(frontend)/api/geo-ip/route.ts`).
- Cause: Network-bound third-party lookups.
- Improvement path: Cache responses by IP (short TTL), or move lookup to client-only with consent.

## Fragile Areas

**Comment likes and `comment-likes` collection:**
- Files: `src/collections/CommentLikes/index.ts`, hooks under `src/collections/CommentLikes/hooks/`, `src/app/(frontend)/api/site-comments/like/route.ts`, `src/app/(frontend)/api/site-comments/route.ts`.
- Why fragile: `read` on `comment-likes` is effectively admin-only in collection access; routes rely on `overrideAccess: true` plus manual queries. Counts sync via hooks (`syncCommentLikeCount.ts`).
- Common failures: Access drift, duplicate likes (mitigated by `preventDuplicateCommentLike`), or wrong `likeCount` if hooks are bypassed in bulk ops.
- Safe modification: Change `Comments` / `CommentLikes` in the same PR as any route that uses `overrideAccess`; add integration tests around like toggle and list visibility.

**Payload jobs `run` access:**
- File: `src/payload.config.ts` (`jobs.access.run`): allows any authenticated user or `Authorization: Bearer ${CRON_SECRET}`.
- Why fragile: If Payload admin exposes job UI to non-admin roles, execution policy may be broader than intended.
- Safe modification: Align `run` with `isUsersCollectionAdmin` or service-only cron.

## Scaling Limits

**Postgres connection pool:**
- Current configuration: Single `DATABASE_URL` pool in `src/payload.config.ts` (`postgresAdapter`).
- Limit: Connection exhaustion under high concurrent Next.js serverless/edge invocations depends on host limits; not quantified here.
- Scaling path: PgBouncer, larger pool, or serverful Node with tuned pool size.

**Search index growth (`search` collection via plugin):**
- Current capacity: `searchPlugin` on `posts` in `src/plugins/index.ts` with `beforeSync` in `src/search/beforeSync.ts`.
- Limit: Large post counts increase index collection size and sync work.
- Scaling path: Batch reindex jobs, prune old search docs, monitor table size.

## Dependencies at Risk

**Tight coupling to Payload CMS 3.x:**
- Risk: Major version upgrades require coordinated bumps across `@payloadcms/*` and `payload` (`package.json` pins `3.79.1`).
- Impact: Breaking admin or adapter changes affect all collections and routes.
- Migration plan: Follow Payload upgrade guides; run `generate:types` and `generate:importmap` after each bump.

**Next.js 15 / React 19:**
- Risk: Framework and peer dependency drift with Payload and Radix.
- Impact: Build or RSC edge cases after upgrades.
- Migration plan: Upgrade with Payload compatibility matrix; run `pnpm build` and full e2e.

## Missing Critical Features

**Rate limiting on public and authenticated APIs:**
- Problem: No middleware-level or route-level rate limits found (no `middleware.ts` in repo root).
- Current workaround: None.
- Blocks: Resilience against comment spam, like abuse, geo-IP quota burn, and view inflation.
- Implementation complexity: Medium (edge middleware + Redis or Upstash, or platform-level rules).

**Automated coverage for auth and comments:**
- Problem: `tests/int/api.int.spec.ts` only checks `payload.find` on `users` without asserting access control behavior; comment flows are not covered.
- Current workaround: Manual QA.
- Blocks: Confidence when changing `src/app/(frontend)/api/site-comments/*` or collections.
- Implementation complexity: Medium (test DB, seeded user, HTTP calls to route handlers).

## Test Coverage Gaps

**Integration smoke test only:**
- What's not tested: Authorization boundaries on `site-comments`, Google OAuth callback, seed route, `increment-views`, `geo-ip`.
- Files: `tests/int/api.int.spec.ts` uses `src/payload.config` directly without HTTP layer.
- Risk: Regressions in `src/app/(frontend)/api/**/route.ts` behavior go unnoticed.
- Priority: High for routes that mutate data or use `overrideAccess`.
- Difficulty to test: Requires request mocking or Playwright with auth cookies.

**E2E scope:**
- What's not tested: Admin flows (`tests/e2e/admin.e2e.spec.ts` exists but coverage not verified in depth), comments, likes, OAuth.
- Risk: UI breaks in `src/components/Auth/PostComments.tsx` (large client component) without automated signal.
- Priority: Medium for core engagement features.
- Difficulty to test: Auth + seeded user + stable selectors.

---

*Concerns audit: 2026-04-19*
*Update as issues are fixed or new ones discovered*
