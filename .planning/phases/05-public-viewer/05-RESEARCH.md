# Phase 5: Public viewer - Research

**Researched:** 2026-04-20  
**Domain:** Next.js App Router + Payload auth/access + Stream Video viewer lifecycle  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Viewer entry and auth flow
- **D-01:** Unauthenticated access to `/live/[slug]` redirects to `/` with `auth=login_required` and `returnTo` set to the current viewer URL.
- **D-02:** Viewer client uses Stream `tokenProvider` that calls `POST /api/stream/token` on demand instead of a one-time token pass.
- **D-03:** Server page loads `livestreams` by `slug` using Payload Local API with `user` and `overrideAccess: false` so collection access rules remain authoritative.
- **D-04:** Stream viewer identity stays aligned with existing mapping (`id = String(user.id)` with display name/email fallback from Payload user).
- **D-05:** If token endpoint returns `401`, redirect through login flow and return back to the same `/live/[slug]`.
- **D-06:** Keep auth enforcement source-of-truth in server page + API checks; middleware expansion to `/live/*` is optional optimization, not a requirement.
- **D-07:** Keep Stream user upsert responsibility in the existing token route; do not add a separate viewer pre-sync endpoint.
- **D-08:** Treat viewer route/data as authenticated dynamic data (no shared/public cache behavior).

### Video rendering behavior
- **D-09:** Attempt Stream call join only when session status is `live`.
- **D-10:** Use SDK default auto-reconnect behavior for transient disconnects, with lightweight reconnecting feedback.
- **D-11:** Create `StreamVideoClient` / call only for live state and always clean up on unmount/status transition.
- **D-12:** While viewer is open, periodically refetch session status; when state transitions to `live`, auto-join and switch from placeholder to player.

### Claude's Discretion
- Poll interval/backoff strategy for status refresh in viewer page/client.
- Exact reconnecting/loading microcopy and spinner treatment.
- Whether login redirect guard is implemented in middleware, server page, or both, as long as D-01 and D-06 hold.

### Deferred Ideas (OUT OF SCOPE)
- Anonymous/public viewer access without login (would change Phase 2 access model and is out of v1 scope).
- Rich viewer enhancements (chat sidebar, reactions, DVR/VOD playback) are future capability phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIEW-01 | Trang công khai cho phép người xem join call dạng `livestream` và hiển thị UI viewer | Viewer route at `/live/[slug]`, auth-gated server page, Stream `tokenProvider`, `StreamVideo` + `StreamCall` + `LivestreamLayout` for joined live state [VERIFIED: codebase], [CITED: https://getstream.io/video/docs/react/ui-cookbook/watching-a-livestream], [CITED: https://getstream.io/video/docs/react/guides/client-auth] |
| VIEW-02 | Trạng thái UX khi chưa live / đã kết thúc (không chỉ màn hình lỗi thô) | Status-driven state machine using Payload `status` (`scheduled`/`live`/`ended`) with placeholders and transition polling [VERIFIED: codebase], [VERIFIED: 05-CONTEXT D-09..D-12] |
</phase_requirements>

## Summary

Phase 5 should be implemented as an authenticated, dynamic App Router page (`/live/[slug]`) that performs server-side user/session validation and Payload slug lookup with enforced access control (`overrideAccess: false`) before rendering a client viewer surface. This matches existing broadcaster architecture and keeps authorization source-of-truth on server/API boundaries. [VERIFIED: `src/app/(frontend)/broadcaster/[slug]/page.tsx`, `src/collections/Livestreams/index.ts`], [CITED: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/redirect.mdx], [CITED: https://github.com/payloadcms/payload/blob/v3.83.0/tools/claude-plugin/skills/payload/reference/ACCESS-CONTROL.md]

For Stream integration, the standard pattern is `StreamVideoClient` with `tokenProvider`, joining a `livestream` call only when status is `live`, and rendering `LivestreamLayout` within `StreamVideo`/`StreamCall`. Token refresh should remain delegated to `POST /api/stream/token`; the SDK handles token refresh by re-calling `tokenProvider`. [CITED: https://getstream.io/video/docs/react/guides/client-auth], [CITED: https://getstream.io/video/docs/react/ui-cookbook/watching-a-livestream], [VERIFIED: `src/app/(frontend)/api/stream/token/route.ts`]

UX delivery for VIEW-02 is a deterministic status state machine: `scheduled|draft` => waiting placeholder, `live` => player, `ended` => ended placeholder, plus reconnecting hint during transient network issues using Stream calling state hooks. [VERIFIED: 05-UI-SPEC], [CITED: https://getstream.io/video/docs/react/guides/calling-state-and-lifecycle]

**Primary recommendation:** Reuse the broadcaster lifecycle/auth patterns and implement a status-driven viewer page that lazily creates Stream client/call only when `status === 'live'`, with periodic status refresh and explicit cleanup on transition/unmount.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth gate for `/live/[slug]` entry | Frontend Server (SSR) | API / Backend | Redirect decisions need request cookies/user context before UI render. [VERIFIED: codebase pattern], [CITED: Next.js redirect docs] |
| Livestream document lookup by slug | API / Backend | Frontend Server (SSR) | Payload Local API access control must run server-side with `user` + `overrideAccess: false`. [VERIFIED: codebase], [CITED: Payload access-control docs] |
| Stream token issuance/refresh | API / Backend | — | Token signing uses server secret and existing API route contract. [VERIFIED: `/api/stream/token` route] |
| Viewer media rendering + reconnect feedback | Browser / Client | — | Stream React SDK call session and call-state UI run client-side. [CITED: Stream React docs] |
| Livestream status transition polling | Browser / Client | API / Backend | Client drives refresh cadence; server remains source of truth for status. [VERIFIED: D-12 decision] |

## Project Constraints (from .cursor/rules/)

- Use TypeScript-first implementation and keep strict typing with generated Payload types. [VERIFIED: `AGENTS.md`, `.cursor/rules/gsd-workflow-context.md`]
- When using Payload Local API with a `user`, always set `overrideAccess: false`. [VERIFIED: `.cursor/rules/security-critical.mdc`]
- For nested Payload operations in hooks, pass `req` to keep transaction safety (relevant if hook edits are introduced). [VERIFIED: `.cursor/rules/security-critical.mdc`]
- After schema changes run `generate:types`; after component path changes run `generate:importmap`. [VERIFIED: `AGENTS.md`]
- Prefer repo convention tooling; this project currently runs dependency install/scripts primarily via pnpm, with bun used for selected scripts. [VERIFIED: `package.json`, `.cursor/rules/gsd-workflow-context.md`]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 15.4.11 (repo), latest 16.2.4 | App Router server page + redirects + route handlers | Existing app runtime and routing model already established for broadcaster flow. [VERIFIED: `package.json`], [VERIFIED: npm registry via `bunx npm view next`] |
| `payload` | 3.79.1 (repo), latest 3.83.0 | Auth/session + Local API read by slug + access control | Existing domain model and auth source of truth already in Payload. [VERIFIED: `package.json`], [VERIFIED: npm registry via `bunx npm view payload`] |
| `@stream-io/video-react-sdk` | 1.35.2 | Viewer client, call join, `LivestreamLayout`, calling state hooks | Official React SDK with built-in livestream UI primitives and lifecycle hooks. [VERIFIED: `package.json`], [VERIFIED: npm registry via `bunx npm view @stream-io/video-react-sdk`], [CITED: Stream docs] |
| `@stream-io/node-sdk` | 0.7.54 | Server token minting and Stream user upsert | Existing backend token endpoint already uses this SDK. [VERIFIED: `package.json`, `/api/stream/token`], [VERIFIED: npm registry via `bunx npm view @stream-io/node-sdk`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/stream/publicClientEnv` helper | in-repo | Guards `NEXT_PUBLIC_STREAM_API_KEY` runtime contract | Always before creating Stream client in viewer page/client. [VERIFIED: `src/lib/stream/publicClientEnv.ts`] |
| `@/utilities/livestreamViewerUrl` helper | in-repo | Canonical `/live/[slug]` path contract | Use for login returnTo consistency and admin links parity. [VERIFIED: `src/utilities/livestreamViewerUrl.ts`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `StreamVideoClient` + `LivestreamLayout` wiring | `LivestreamPlayer` component | Simpler integration, but less control for custom status/auth transition UX needed by VIEW-02. [CITED: https://getstream.io/video/docs/react/guides/livestreaming] |

**Installation:**
```bash
bun add @stream-io/video-react-sdk @stream-io/node-sdk
```

**Version verification:** latest package versions were verified on 2026-04-20 via npm registry queries run through `bunx npm view`:
- `@stream-io/video-react-sdk`: 1.35.2, modified 2026-04-15
- `@stream-io/node-sdk`: 0.7.54, modified 2026-04-17
- `next`: 16.2.4, modified 2026-04-18
- `payload`: 3.83.0, modified 2026-04-19

## Architecture Patterns

### System Architecture Diagram

```text
Browser GET /live/[slug]
  -> Next.js server page
    -> payload.auth(headers) for session
      -> no user? redirect "/?auth=login_required&returnTo=/live/[slug]"
      -> user exists:
           payload.find(livestreams, where slug, user, overrideAccess:false)
             -> not found/forbidden: notFound or access UI
             -> found:
                 render client viewer shell with status + stream user identity
                   -> status != live: show scheduled/draft/ended placeholder
                   -> status == live:
                        create StreamVideoClient(tokenProvider => POST /api/stream/token)
                          -> token 200: call.join(create:false) -> LivestreamLayout
                          -> token 401: redirect through login flow with returnTo
                   -> periodic status refetch
                        -> scheduled->live: auto-join and switch to player
                        -> live->ended: leave call, disconnect client, show ended state
```

### Recommended Project Structure
```text
src/
├── app/(frontend)/live/[slug]/page.tsx          # server auth + slug lookup + initial state
├── app/(frontend)/live/[slug]/Viewer.client.tsx # Stream lifecycle + status UX states
├── app/(frontend)/api/livestreams/[slug]/status/route.ts (optional) # lightweight polling endpoint
└── lib/stream/                                   # existing env/user helpers reused
```

### Pattern 1: Server-first auth and data gate
**What:** Validate user and fetch livestream by slug on server page before rendering viewer client.  
**When to use:** Every entry to protected viewer route.  
**Example:**
```typescript
// Source: existing broadcaster page pattern + Next redirect docs
const { user } = await payload.auth({ headers: await headers() })
if (!user) {
  redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/live/${decodedSlug}`)}`)
}

const result = await payload.find({
  collection: 'livestreams',
  where: { slug: { equals: decodedSlug } },
  user,
  overrideAccess: false,
  limit: 1,
  pagination: false,
})
```

### Pattern 2: Live-only Stream client lifecycle
**What:** Create/join Stream client+call only during `live` status; always leave/disconnect in cleanup.  
**When to use:** Viewer component with status-driven transitions.  
**Example:**
```typescript
// Source: Stream React docs + existing Broadcaster.client lifecycle pattern
const client = new StreamVideoClient({ apiKey, user, tokenProvider })
const call = client.call(callType, callId)
await call.join({ create: false })
// cleanup: await call.leave(); await client.disconnectUser()
```

### Pattern 3: Calling-state-driven reconnect UX
**What:** Use `useCallStateHooks().useCallCallingState()` and map reconnect states to UI hints.  
**When to use:** During transient network issues while viewer is watching live.  
**Example:**
```typescript
// Source: Stream calling-state docs
const { useCallCallingState } = useCallStateHooks()
const callingState = useCallCallingState()
const reconnecting =
  callingState === CallingState.RECONNECTING || callingState === CallingState.MIGRATING
```

### Anti-Patterns to Avoid
- **Joining before status is `live`:** violates D-09 and causes noisy errors for scheduled sessions.
- **Caching authenticated viewer data publicly:** conflicts with D-08 and risks cross-user leakage.
- **Using one-shot token prop instead of `tokenProvider`:** breaks refresh behavior and diverges from D-02.
- **Forgetting `leave()/disconnectUser()` on status transition/unmount:** causes stale socket/device state and potential duplicate sessions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video player and call lifecycle | Custom WebRTC player stack | Stream React SDK (`StreamVideoClient`, `StreamCall`, `LivestreamLayout`) | SDK handles call state, media plumbing, and reconnect edge cases. [CITED: Stream docs] |
| Token refresh orchestration | Manual refresh timers | `tokenProvider` callback in Stream client | SDK re-requests token on expiry automatically. [CITED: Stream client-auth docs] |
| Auth redirect mechanics | Ad-hoc client-side redirects only | Server `redirect()` + optional middleware guard | Server-first guard avoids flash-of-protected-content and keeps SSR consistent. [CITED: Next.js redirect docs], [VERIFIED: broadcaster pattern] |

**Key insight:** This phase is mostly composition of existing contracts (Payload auth/access + Stream SDK lifecycle), not invention of new infra.

## Common Pitfalls

### Pitfall 1: Access bypass in Local API
**What goes wrong:** Viewer page loads livestream with `user` but without `overrideAccess: false`, effectively bypassing access rules.  
**Why it happens:** Payload Local API defaults `overrideAccess` to true.  
**How to avoid:** Always set `overrideAccess: false` when `user` is provided.  
**Warning signs:** Anonymous users can read data unexpectedly in local testing.

### Pitfall 2: Status race between page load and client join
**What goes wrong:** Viewer joins call using stale initial status; broadcaster already ended or not yet live.  
**Why it happens:** Initial SSR status is a snapshot.  
**How to avoid:** Poll for status updates and gate join logic strictly by latest status.  
**Warning signs:** Frequent join failures immediately after page open.

### Pitfall 3: No explicit `401` recovery in tokenProvider
**What goes wrong:** Token endpoint expires session; viewer remains stuck with generic fetch error.  
**Why it happens:** tokenProvider throws but app doesn’t route to login flow.  
**How to avoid:** Detect `401` in tokenProvider fetch path and redirect using `returnTo` contract (D-05).  
**Warning signs:** Repeating token fetch errors without login prompt.

## Code Examples

Verified patterns from official sources:

### Stream tokenProvider client auth
```typescript
// Source: https://getstream.io/video/docs/react/guides/client-auth
const tokenProvider = async () => {
  const response = await fetch('/api/stream/token', { method: 'POST', credentials: 'include' })
  const data = await response.json()
  return data.token
}

const client = new StreamVideoClient({ apiKey, tokenProvider, user })
```

### Livestream layout integration
```tsx
// Source: https://getstream.io/video/docs/react/ui-cookbook/watching-a-livestream
<StreamVideo client={client}>
  <StreamCall call={call}>
    <LivestreamLayout />
  </StreamCall>
</StreamVideo>
```

### Next.js server redirect for protected route
```tsx
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/redirect.mdx
if (!user) {
  redirect('/login')
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One-shot token passed into client init | `tokenProvider` function with SDK-managed refresh | Current Stream React guidance | Better session continuity and lower token-expiry breakage. [CITED: Stream client-auth docs] |
| Client-only auth guard after render | Server-side redirect in App Router page/middleware | Next App Router standard | Prevents unauthorized content flash and stabilizes route behavior. [CITED: Next.js redirect docs] |

**Deprecated/outdated:**
- Relying on static token only for long-lived viewer sessions is outdated for robust livestream UX. [CITED: Stream client-auth docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Polling can be done either with direct page refresh endpoint or re-fetch from server action without introducing websocket subscription complexity in this phase. [ASSUMED] | Architecture Patterns | Medium (could affect implementation granularity and network load) |

## Open Questions (RESOLVED)

1. **Polling transport choice for D-12** — RESOLVED
   - Decision: implement a dedicated route handler `GET /api/livestreams/[slug]/status` returning `{ status, callId, callType, slug }`.
   - Rationale: keeps client polling deterministic, minimizes page payload churn, and makes integration/e2e testing straightforward.

2. **Guest-facing 403/not-found messaging for authenticated non-member edge cases** — RESOLVED
   - Decision: keep access-safe behavior using generic not-found treatment (no existence leak) and reserve explicit denial messaging for a later access-policy phase.
   - Rationale: aligns with current collection read policy and avoids introducing scope creep in Phase 5.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | package querying / optional scripts | ✓ | 1.2.14 | — |
| Node.js | Next/Payload runtime | ✓ | v22.21.1 | — |
| pnpm | existing repo scripts (`dev`, `test`, `build`) | ✓ | 10.32.0 | — |
| PostgreSQL CLI (`psql`) | optional local DB inspection during troubleshooting | ✗ | — | use app-level tests + existing `DATABASE_URL` service |
| Stream API keys env (`STREAM_API_KEY`, `STREAM_API_SECRET`, `NEXT_PUBLIC_STREAM_API_KEY`) | token route + viewer client setup | Partial (declared in `.env.example`) | — | block viewer runtime until configured |

**Missing dependencies with no fallback:**
- Valid Stream credentials are required for real viewer join behavior.

**Missing dependencies with fallback:**
- Missing `psql` local CLI is non-blocking for this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Playwright 1.58.2 [VERIFIED: `package.json`] |
| Config file | `vitest.config.mts`, `playwright.config.ts` |
| Quick run command | `pnpm run test:int -- --config ./vitest.config.mts` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIEW-01 | Authenticated member can open `/live/[slug]`, use tokenProvider, and join viewer UI in live state | integration | `pnpm run test:int -- tests/int/viewer-page.int.spec.ts` | ❌ Wave 0 |
| VIEW-02 | Scheduled/ended placeholders and live transition behavior are explicit and non-raw | integration | `pnpm run test:int -- tests/int/viewer-client.int.spec.ts` | ❌ Wave 0 |
| VIEW-01/02 | Browser-level route and UX regression for viewer flow | e2e smoke | `pnpm run test:e2e -- tests/e2e/viewer.e2e.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm run test:int -- tests/int/viewer-page.int.spec.ts tests/int/viewer-client.int.spec.ts`
- **Per wave merge:** `pnpm run test:int`
- **Phase gate:** `pnpm run test`

### Wave 0 Gaps
- [ ] `tests/int/viewer-page.int.spec.ts` — server auth gate + slug query + redirect contract (VIEW-01)
- [ ] `tests/int/viewer-client.int.spec.ts` — status gating + lifecycle cleanup + reconnect copy (VIEW-01/02)
- [ ] `tests/e2e/viewer.e2e.spec.ts` — live/scheduled/ended UX flow smoke test (VIEW-02)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Payload session auth + server redirect contract |
| V3 Session Management | yes | Short-lived Stream token from server endpoint; SDK token refresh via tokenProvider |
| V4 Access Control | yes | Payload collection access + `overrideAccess: false` on Local API read |
| V5 Input Validation | yes | Slug decode/sanitize + controlled query constraints |
| V6 Cryptography | yes | Stream token signing via official Node SDK (no custom crypto) |

### Known Threat Patterns for Next.js + Payload + Stream stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Access control bypass via Local API defaults | Elevation of Privilege | Always set `overrideAccess: false` with user context |
| Token endpoint abuse from unauthenticated caller | Spoofing | `payload.auth` checks and 401/403 responses in token route |
| Viewer page cache leakage across users | Information Disclosure | Treat route as authenticated dynamic data (D-08), avoid shared public caching |
| Stale session during token refresh | Denial of Service (user-level) | Handle 401 in tokenProvider and force login redirect with `returnTo` |

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/getstream_io_video_react` - client auth (`tokenProvider`), livestream UI (`LivestreamLayout`), calling state lifecycle.
- Context7 `/vercel/next.js` - App Router `redirect()` behavior for server components.
- Context7 `/payloadcms/payload/v3.83.0` - Local API access control with `overrideAccess: false`.
- Codebase files: `src/app/(frontend)/broadcaster/[slug]/page.tsx`, `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx`, `src/app/(frontend)/api/stream/token/route.ts`, `src/collections/Livestreams/index.ts`, `src/lib/stream/publicClientEnv.ts`, `src/utilities/livestreamViewerUrl.ts`.
- Registry checks via `bunx npm view` for `@stream-io/video-react-sdk`, `@stream-io/node-sdk`, `next`, `payload`.

### Secondary (MEDIUM confidence)
- `.cursor/rules/security-critical.mdc` and `AGENTS.md` constraints cross-validated against codebase patterns.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified by current repo deps and live registry/package versions.
- Architecture: HIGH - anchored in locked phase decisions plus existing broadcaster implementation.
- Pitfalls: HIGH - validated against Payload security rule + Stream/Next official docs.

**Research date:** 2026-04-20  
**Valid until:** 2026-05-20
