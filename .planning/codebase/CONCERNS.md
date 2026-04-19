# Codebase Concerns

**Analysis Date:** 2026-04-19

## Tech Debt

**Template branding still embedded in metadata and seeds:**
- Issue: Site title and Open Graph defaults still use the upstream template string `Payload Website Template` in multiple places.
- Files: `src/utilities/generateMeta.ts`, `src/utilities/mergeOpenGraph.ts`, `src/plugins/index.ts`, `src/app/(frontend)/posts/page.tsx`, `src/app/(frontend)/posts/page/[pageNumber]/page.tsx`, `src/app/(frontend)/search/page.tsx`, `src/endpoints/seed/home.ts`, `src/endpoints/seed/home-static.ts`
- Impact: Inconsistent branding in production if CMS content differs from tests; SEO and social share previews may show wrong product name.
- Fix approach: Centralize default site name in one module (or a global) and replace literals; align Playwright expectations in `tests/e2e/frontend.e2e.spec.ts` with the real homepage.

**Monolithic category route:**
- Issue: `src/app/(frontend)/categories/[slug]/page.tsx` (~463 lines) combines data fetching, sidebar queries, layout, and newsletter block in one file.
- Impact: Harder to test, reuse, or optimize; changes risk regressions across unrelated sections.
- Fix approach: Extract data loaders (e.g. `queryFeaturedForCategory`, sidebar helpers) into `src/app/(frontend)/categories/[slug]/queries.ts` or `src/blocks/...` co-located modules; keep the page as composition only.

**Block renderer typing shortcut:**
- Issue: `src/blocks/RenderBlocks.tsx` uses `@ts-expect-error` when spreading block props into `Block` because the mapped `blockComponents` union does not match Payload’s generated block discriminated union.
- Impact: Refactors to block props can silently break at runtime; TypeScript does not guard the contract.
- Fix approach: Generate or narrow a `BlockProps` map per `blockType`, or use a typed switch with exhaustive handlers per block slug.

**Generated types file fully eslint-disabled:**
- Issue: `src/payload-types.ts` begins with `/* eslint-disable */` (generated file).
- Impact: Legitimate lint issues elsewhere can be harder to spot if developers copy patterns from generated `any` fields.
- Fix approach: Keep treating as generated-only; avoid hand-edits; run `pnpm generate:types` after schema changes and rely on editor exclude for lint noise.

## Known Bugs

**E2E homepage assertion tied to seeded title:**
- Symptoms: `tests/e2e/frontend.e2e.spec.ts` expects document title and `h1` to match `Payload Website Template`.
- Trigger: Deploy with a different home page title from CMS or after rebrand without updating the test.
- Workaround: Update test strings when marketing copy changes.
- Root cause: Test encodes template default instead of a stable test id or env-driven base URL assertion.

**Comment like count under concurrent toggles (theoretical drift):**
- Symptoms: `likeCount` could diverge from actual rows if many requests race.
- Trigger: Rapid double-clicks or parallel requests on `POST /api/site-comments/like` for the same user/comment before hooks complete.
- Files: `src/collections/CommentLikes/hooks/syncCommentLikeCount.ts` (read current count, then update with `+1` / `-1`).
- Workaround: Rare in practice for low traffic.
- Root cause: Non-atomic increment/decrement; not using a single SQL `UPDATE ... SET like_count = like_count + 1` or equivalent.

## Security Considerations

**Seed endpoint allows any authenticated user:**
- Risk: Any logged-in user who can hit `POST` on the seed route may trigger full database seeding (destructive / data overwrite depending on `seed` implementation).
- Files: `src/app/(frontend)/next/seed/route.ts` (checks `user` only, not role).
- Current mitigation: Route must be discoverable only to someone who knows the path; still unsafe if exposed.
- Recommendations: Restrict to admin role (reuse `isUsersCollectionAdmin` from `src/access/isAdminUser.ts`), or disable the route in production via env flag, or remove from production builds.

**Post view increment relies on HTTP-only cookie:**
- Risk: View counts can be inflated by clearing cookies or using different clients; no per-IP or stronger rate limit.
- Files: `src/app/(frontend)/api/posts/[id]/increment-views/route.ts` (`overrideAccess: true` for read/update is appropriate for anonymous counter; cookie is `httpOnly`, 24h).
- Current mitigation: One increment per cookie per post per day.
- Recommendations: Accept for analytics-style metrics; for fraud-proof counts use server-side dedup (e.g. hashed IP + post id window) or an analytics pipeline.

**Geo IP lookup endpoint:**
- Risk: `GET /api/geo-ip` accepts `?ip=` for a client-supplied IP (when it passes `isPublicRoutableIp`). Unauthenticated callers could abuse it to burn third-party API quota (`IPGEOLOCATION_API_KEY`) or use the app as a geo lookup relay.
- Files: `src/app/(frontend)/api/geo-ip/route.ts`
- Current mitigation: Public IP validation; falls back to `ip-api.com` without key.
- Recommendations: Rate limit the route; require auth for arbitrary `?ip=`; or drop query override and only use connection headers.

**Google OAuth callback uses temporary passwords on each login:**
- Risk: Storing rotating random passwords in the DB for OAuth users is a known pattern for `payload.login` but increases surface if user collection is leaked.
- Files: `src/app/(frontend)/api/auth/google/callback/route.ts`
- Current mitigation: `randomBytes(32)` per flow; ID token verified with `verifyIdToken`.
- Recommendations: Document threat model; ensure Users collection field-level access for `password` is locked down in Payload (verify `src/collections/Users`).

## Performance Bottlenecks

**Comment moderation loads all rules on every create/update:**
- Problem: `applyCommentModeration` fetches up to 500 `comment-moderation-rules` documents per hook invocation.
- Files: `src/collections/Comments/hooks/applyCommentModeration.ts`
- Measurement: Not profiled in-repo; cost grows linearly with rule count.
- Cause: Full table scan in application code each time.
- Improvement path: Cache rules in `req.context` for the request, reduce `limit` with indexing strategy, or move keyword checks to a dedicated service.

**Category page parallel Payload queries:**
- Problem: Multiple `payload.find` calls in parallel for featured posts, all categories, sidebar form, sidebar posts, and assets.
- Files: `src/app/(frontend)/categories/[slug]/page.tsx`
- Measurement: Not profiled; cold TTFB depends on Postgres latency × query count.
- Cause: Rich page assembly in one request.
- Improvement path: `unstable_cache` / Next.js `cache()` for stable globals; selective `select` and `depth` reduction; ISR where appropriate.

**No application-level rate limiting:**
- Problem: Public POST endpoints (`increment-views`, `site-comments`, `site-comments/like`) have no throttle middleware.
- Files: Under `src/app/(frontend)/api/`
- Cause: Not implemented.
- Improvement path: Edge or Next middleware with Redis/Upstash, or Payload-friendly rate limit at reverse proxy.

## Fragile Areas

**Comment like count sync hooks:**
- Files: `src/collections/CommentLikes/hooks/syncCommentLikeCount.ts`
- Why fragile: Read-modify-write on `comments.likeCount` tied to hook ordering and concurrent requests.
- Common failures: Off-by-one under concurrency; failed mid-update leaving inconsistent count vs rows.
- Safe modification: Prefer DB-level aggregate or atomic SQL; add integration test for sequential like/unlike.

**Client comment UI state:**
- Files: `src/components/Auth/PostComments.tsx` (~507 lines)
- Why fragile: Pagination, sort, optimistic updates, and highlight logic interact; easy to break cache keys or page state.
- Common failures: Stale React Query cache after mutations; wrong page when switching sort.
- Safe modification: Keep `commentsQueryKey` usage consistent; add tests around query key invalidation.
- Test coverage: No dedicated unit tests; relies on manual and E2E.

**OAuth and env configuration:**
- Files: `src/app/(frontend)/api/auth/google/route.ts`, `src/app/(frontend)/api/auth/google/callback/route.ts`
- Why fragile: Missing env yields redirects with query messages; easy to misconfigure redirect URI in Google Cloud.
- Safe modification: Document required env vars (names only) in internal runbooks; never commit secrets.

## Scaling Limits

**Postgres connection pool (default adapter settings):**
- Current capacity: Driven by `DATABASE_URL` and default pool in `postgresAdapter` (`src/payload.config.ts`).
- Limit: Connection exhaustion under high concurrent serverless invocations.
- Scaling path: Tune pool size, use PgBouncer, or regional DB.

**Moderation rules collection:**
- Current capacity: Hook loads up to 500 rules (`limit: 500` in `applyCommentModeration`).
- Limit: Rules beyond 500 are ignored silently for matching.
- Scaling path: Raise limit with caution or partition rules (e.g. keyword index).

## Dependencies at Risk

**Tight coupling to Payload 3.79.x and Next 15.4.x:**
- Risk: Template pins multiple `@payloadcms/*` packages to the same minor; upgrades may require coordinated bumps.
- Impact: Security patches and features need tested batch upgrades.
- Migration plan: Follow Payload release notes; run `pnpm generate:types` and `pnpm generate:importmap` after upgrades.

## Missing Critical Features

**Next.js middleware for cross-cutting policies:**
- Problem: No `middleware.ts` in repo root for security headers, geo blocking, or auth gating of `/admin` beyond Payload’s own handling.
- Blocks: Centralized CSP, rate limits, or auth redirects at the edge.
- Implementation complexity: Low for static headers; medium for session-aware logic.

**Automated coverage for custom API routes:**
- Problem: Integration tests only smoke-test `payload.find` on `users` (`tests/int/api.int.spec.ts`).
- Blocks: Regression detection for comments, likes, OAuth, and view counter.
- Implementation complexity: Medium (need test DB and HTTP layer or supertest).

## Test Coverage Gaps

**Custom REST and comment flows:**
- What's not tested: `POST /api/site-comments`, `POST /api/site-comments/like`, `POST /api/posts/[id]/increment-views`, Google OAuth callback behavior.
- Files: `src/app/(frontend)/api/**`
- Risk: Auth and access-control regressions in API routes go unnoticed.
- Priority: High for seed route and comment APIs; Medium for view counter.
- Difficulty to test: Requires Payload test utils, cookies, and optional OAuth mocks.

**Integration test uses Local API without access-control assertion:**
- What's not tested: `tests/int/api.int.spec.ts` does not assert `overrideAccess` behavior or role boundaries.
- Risk: False confidence that “API works” while production REST differs.
- Priority: Low for smoke; Medium if expanding int tests.

---

*Concerns audit: 2026-04-19*
*Update as issues are fixed or new ones discovered*
