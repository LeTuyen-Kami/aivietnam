# Phase 2 — Technical Research (Payload session model)

**Question:** What do we need to know to plan the `livestreams` collection and access control well?

## Executive summary

Implement a new Payload **collection** (`livestreams`) on **Postgres** via `@payloadcms/db-postgres`, following existing patterns (`Posts` for `slugField` + `slugifyTitle`, `Users` + `isUsersCollectionAdmin` for admin checks). **Read access** must encode: no anonymous reads; admins see all; authenticated non-admins see only documents where `status !== 'draft'` — implemented with Payload `access.read` returning a **Where** clause for non-admins and `true` for admins, and `false` when `req.user` is absent [CITED: Payload access docs — query constraints]. **Write** operations are admin-only using `isUsersCollectionAdmin` [VERIFIED: `src/access/isAdminUser.ts`]. After schema changes, run **`pnpm payload migrate`** (see repo `README.md`) so the live database matches config, then **`pnpm generate:types`** for `payload-types.ts`.

## Stack alignment

| Topic | Finding | Confidence |
|-------|---------|------------|
| DB adapter | `postgresAdapter` in `src/payload.config.ts` — new collection adds tables/columns via Payload migrate | HIGH |
| Slug | Reuse `slugField({ slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify) })` like `Posts` [VERIFIED: `src/collections/Posts/index.ts`] | HIGH |
| Admin check | `isUsersCollectionAdmin(req.user)` [VERIFIED: `src/access/isAdminUser.ts`] | HIGH |
| Local API security | Pass `req`; use `overrideAccess: false` when passing `user` in hooks [from AGENTS.md / project rules] | HIGH |

## Access control design

**Create / update / delete:** `({ req: { user } }) => isUsersCollectionAdmin(user)` — boolean [CITED: Payload access].

**Read:**

- If `!req.user` → `false` (no anonymous or public read) — matches CONTEXT D-07–D-09.
- If `isUsersCollectionAdmin(user)` → `true` (read all including drafts).
- Else (authenticated member) → Where: `{ status: { not_equals: 'draft' } }` — encodes D-06/D-08.

**REST/GraphQL:** Collection-level `access` applies; no separate public bypass [ASSUMED: standard Payload 3 behavior — confirm in admin if behavior differs for GraphQL].

**Indexes:** `slug` unique — `slugField` / field `unique: true` as in Posts pattern [VERIFIED: slugField usage].

## Pitfalls

1. **Local API in later phases:** Callers must use `overrideAccess: false` when passing `user` or they bypass access [from security-critical rules].
2. **Draft visibility:** Query constraint must use exact `status` value `'draft'` to match select options.
3. **Migrate before manual QA:** Typecheck can pass without DB push; **migrate is blocking** for real admin UI testing.
4. **Infinite hooks:** If `beforeChange` updates same collection, use `context` flag to skip loops [AGENTS.md].

## Project constraints (from `.cursor/rules/` / AGENTS.md)

- TypeScript-first; run `generate:types` after schema changes.
- `overrideAccess: false` when passing `user` to Local API.
- Pass `req` to nested operations in hooks.

## Validation Architecture

Phase verification should rely on:

- **Static:** `pnpm exec tsc --noEmit` after type generation.
- **Structural:** `grep`-able patterns in `src/collections/Livestreams/index.ts` for `livestreams`, `isUsersCollectionAdmin`, `not_equals: 'draft'`, `overrideAccess` in any new hook-local API calls (if added).
- **Integration:** Optional Vitest tests under `tests/int/` if we add payload test utils; otherwise manual verification in Payload Admin (create draft vs scheduled, second user read).

Nyquist Dimension 8 (validation) is covered by pairing RESEARCH with `02-VALIDATION.md` and plan acceptance criteria.

---

## RESEARCH COMPLETE

Research artifact is ready for `gsd-planner`. No blockers.
