# Phase 1 — Technical Research: Stream foundation

## User Constraints

**Copied from `.planning/phases/01-stream-foundation/01-CONTEXT.md` (locked):**

- **D-01:** `String(payloadUser.id)` = Stream `user_id` (no prefix unless future multi-tenant phase).
- **D-02:** On token issue, **upsert** Stream user with `id`, and `name` when available; `image` when User has such a field (current `users` collection has **no image** — upsert `id` + `name` only until a future profile image field exists).
- **D-03–D-05:** `POST /api/stream/token`, Payload session required, `{ token, expiresAt }` ISO 8601, 401 if unauthenticated.
- **D-06–D-08:** `generateUserToken` with `validity_in_seconds` (default 3600), optional `STREAM_TOKEN_VALIDITY_SECONDS`; no permanent tokens for humans.
- **D-09–D-11:** `STREAM_API_KEY`, `STREAM_API_SECRET`; lazy singleton `StreamClient` from `@stream-io/node-sdk`; server-only module; document `NEXT_PUBLIC_STREAM_API_KEY` in `.env.example` comments for later phases.

**Claude's discretion:** Exact singleton filename; upsert every token request is acceptable (idempotent).

---

## Standard Stack

| Concern | Choice | Notes |
|---------|--------|------|
| Server SDK | `@stream-io/node-sdk` `StreamClient` | [CITED: Context7 `/getstream/stream-node` — constructor `(apiKey, apiSecret, options?)`, `generateUserToken({ user_id, validity_in_seconds })`, `upsertUsers([{ id, name, ... }])`] |
| Auth bridge | Payload `getPayload` + `payload.auth({ headers })` | [VERIFIED: codebase] Same pattern as `src/app/(frontend)/api/site-comments/route.ts` |
| Package manager | `pnpm` | [VERIFIED: `package.json` + `pnpm-lock.yaml`] |

**Out of scope for Phase 1:** `@stream-io/video-react-sdk` / `StreamVideoClient` — Phase 4–5; only document public API key in `.env.example`.

---

## Architecture Patterns

1. **Route Handler** — `src/app/(frontend)/api/stream/token/route.ts` exports `POST`; uses `headers()` from `next/headers` and `payload.auth()`.
2. **Server-only lib** — `src/lib/stream/server.ts` exports `getStreamServerClient()` singleton; top `import 'server-only'` after adding dependency [VERIFIED: pattern from Next.js docs; package to add].
3. **Mapping** — Small pure helper e.g. `streamUserIdFromPayloadUser(user: User): string` returning `String(user.id)` with JSDoc referencing STRM-03.

---

## Don't Hand-Roll

- **JWT signing for Stream** — Always use SDK `generateUserToken` [CITED: stream-node docs].
- **Auth** — Do not parse cookies manually; use `payload.auth({ headers })`.

---

## Common Pitfalls

| Pitfall | Mitigation |
|---------|------------|
| Secret in client bundle | Only read `STREAM_*` in Route Handlers / server modules; never `NEXT_PUBLIC_` for secret [CONTEXT D-09]. |
| `overrideAccess` misuse | Token route uses `auth()` for identity; if using Local API with `user`, set `overrideAccess: false` per project rules [VERIFIED: AGENTS.md]. |
| Wrong `upsert` shape | Stream expects `id` (not only `user_id`) in `upsertUsers` array entries [CITED: stream-node examples]. |

---

## Code Examples

```ts
// Token generation (server) — illustrative
const token = client.generateUserToken({
  user_id: streamUserId,
  validity_in_seconds: validitySeconds,
})
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| GetStream API key + secret | STRM-01, STRM-02 | User must create app in GetStream dashboard | — | Cannot complete token E2E without real credentials |
| `@stream-io/node-sdk` | STRM-01 | npm registry | latest compatible | — |

**Missing dependencies with no fallback:**

- Production Stream credentials must be in `.env` locally / deployment — document in `user_setup` on plans.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x [VERIFIED: `package.json`] |
| Config file | `vitest.config.mts` |
| Quick run command | `pnpm exec vitest run --config ./vitest.config.mts` |
| Full suite command | `pnpm run test:int` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| STRM-02 | POST `/api/stream/token` returns 401 without session | integration | Vitest + Next request mock or `tests/int/` pattern | ❌ Wave 0 — add stub in Plan 02 or manual verify |
| STRM-03 | `streamUserIdFromPayloadUser` returns `String(id)` | unit | `vitest run` on `tests/int/stream-user-id.int.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run --config ./vitest.config.mts` (scoped path when possible)
- **Per wave merge:** `pnpm run test:int`
- **Phase gate:** Full int suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/stream-user-id.test.ts` — covers STRM-03 mapping helper
- [ ] Optional: `tests/int/stream-token.test.ts` — 401 unauthenticated (if project pattern supports route tests)

*Existing infrastructure: Vitest + `tests/int/` — extend with new files as in Plan 02 tasks.*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Payload session before issuing Stream JWT |
| V3 Session Management | yes | Cookie-based session; no Stream secret in browser |
| V4 Access Control | yes | 401 if `payload.auth` has no user |
| V5 Input Validation | limited | POST body empty; no user-controlled `user_id` — derive from session only |
| V6 Cryptography | yes | Stream SDK generates JWT; no custom crypto |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Token theft via XSS | Information disclosure | httpOnly Payload cookie; Stream secret server-only |
| Forged `user_id` in body | Spoofing | Ignore body `user_id`; use `auth()` only |

---

## Sources

### Primary (HIGH confidence)

- Context7 `/getstream/stream-node` — `StreamClient`, `generateUserToken`, `upsertUsers`
- `src/app/(frontend)/api/site-comments/route.ts` — `payload.auth` pattern

### Secondary

- `.planning/codebase/STACK.md`, `INTEGRATIONS.md`

---

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — official Node SDK
- Architecture: **HIGH** — matches existing Payload routes
- Pitfalls: **MEDIUM** — integration tests depend on project test harness

**Research date:** 2026-04-19  
**Valid until:** 2026-05-19

## RESEARCH COMPLETE
