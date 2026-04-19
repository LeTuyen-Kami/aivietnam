# Phase 4: Broadcaster (admin-only) - Research

**Researched:** 2026-04-19  
**Domain:** Next.js App Router + Payload auth/access + Stream Video (React SDK + Node SDK)  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Route & access behavior

- **D-01:** Broadcaster route is **`/broadcaster/[slug]`** (chosen to keep URL shape future-friendly; **non-admin broadcasting is deferred**).
- **D-02:** Guard UX: if logged out → **redirect to login**; if logged in but not admin → **403** (access denied).
- **D-03:** v1 discovery: **deep-link from Payload Admin** to `/broadcaster/[slug]` (admin-only nav link can be added later without changing route).

### Session source of truth

- **D-04:** Broadcaster **only starts from an existing Payload `livestreams` doc** created/managed in Payload Admin (no “create new session” from broadcaster in v1).
- **D-05:** Page loads the session by **`slug`** (keep `/broadcaster/[slug]` and query `livestreams` by `slug`).

### Stream identity & orchestration

- **D-06:** Stream `callType` is **`livestream`** (already aligned with Phase 2 schema default).
- **D-07:** Stream `callId` default is **Payload doc id** (stable; not affected by slug edits). Store it in `livestreams.callId` if missing; otherwise keep existing.
- **D-08:** On “Start”: the app should **create/ensure the Stream call exists if missing**, then **join as publisher** (single server-orchestrated flow; clear failure behavior).

### Tokening & publish permissions

- **D-09:** Keep existing **`POST /api/stream/token`** for any logged-in site member token (viewer-capable later).
- **D-10:** Add a **new admin-only token route** dedicated to broadcaster/publish use (separate from `/api/stream/token`).
- **D-11:** Enforce admin role in **both**:
  - **Next middleware** (UX: prevent non-admin from reaching broadcaster pages easily)
  - **Server checks** (security: token minting + any start/join-publish endpoints must reject non-admin)

### Lifecycle & status

- **D-12:** Set `livestreams.status` → **`live`** when admin **successfully joins as publisher** (not on click).
- **D-13:** Set `livestreams.status` → **`ended`** when admin explicitly clicks **End** (not on tab close).
- **D-14:** If admin refreshes during a live session, the page should **auto re-join as publisher** (server token).

### Claude's Discretion

- Exact route path for the admin-only publish token endpoint (e.g. `/api/stream/broadcaster/token`, `/api/stream/token/publish`, etc.).
- Whether broadcaster orchestration uses Server Actions vs Route Handlers (must still satisfy D-08–D-11).
- Exact UX/UI layout for the broadcaster page as long as it uses Stream Video React and satisfies guards and lifecycle rules above.

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

- Allow **non-admin users** to broadcast (v2 requirement `NONADMIN-01`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRD-01 | Route hoặc luồng trên site cho phép **chỉ admin** tạo/bắt đầu phiên livestream (join với quyền publish) | Use `Stream` server SDK to create/ensure call exists; use Stream Video React SDK (`EmbeddedLivestream` or manual `StreamVideoClient`) to join as authenticated user with publish-capable token. |
| BRD-02 | Guard rõ ràng (middleware / server check role) — user thường không vào được | Add Next `middleware.ts` gate for `/broadcaster/*` + server-side guard in route handlers / server components using `payload.auth()` + `isUsersCollectionAdmin`. |
</phase_requirements>

## Summary

Phase 4 is an **admin-only broadcaster page** on the public site (`/broadcaster/[slug]`) that starts from an existing Payload `livestreams` document, ensures a Stream Video `livestream` call exists, and joins the call with **publisher/host** privileges. The system of record remains Payload: the page must set `livestreams.status` to `live` only after the host is actually joined, and set it to `ended` only on explicit “End”. [VERIFIED: codebase `.planning/phases/04-broadcaster-admin-only/04-CONTEXT.md`]

The key planning complexity is **security + orchestration boundaries**: middleware provides UX blocking, but **real security** must live server-side in a dedicated admin-only token minting route and any “start/end” endpoints; when operating “as the logged-in user” through Payload Local API, the project must set `overrideAccess: false` to avoid bypassing access control. [VERIFIED: `.cursor/rules/security-critical.mdc`]

**Primary recommendation:** Implement broadcaster as a **client page** using Stream’s **prebuilt `EmbeddedLivestream`** UI with an **admin-only tokenProvider** and server endpoints that (1) enforce admin, (2) `getOrCreate` the call server-side, and (3) update Payload status (`live`/`ended`) using Local API with `overrideAccess: false`. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/] [CITED: https://getstream.io/video/docs/react/guides/client-auth/] [CITED: https://getstream.io/video/docs/api/calls/]

## Project Constraints (from .cursor/rules/)

- **Payload Local API access control is bypassed unless `overrideAccess: false` is set when passing `user`**. [VERIFIED: `.cursor/rules/security-critical.mdc`]
- **Hooks must pass `req` to nested operations** to keep transaction atomicity. (Phase 4 likely uses route handlers, but if any hooks are added/edited, this is mandatory.) [VERIFIED: `.cursor/rules/security-critical.mdc`]
- **Prevent infinite hook loops** with context flags. [VERIFIED: `.cursor/rules/security-critical.mdc`]
- **Type generation:** run `generate:types` after schema changes (Phase 4 should not require schema changes; if it does, include this task). [VERIFIED: workspace rule excerpt in user message; corroborated by `package.json` scripts]
- **Testing infra exists:** Vitest + Playwright are present; nyquist validation is enabled. [VERIFIED: `.planning/config.json`] [VERIFIED: `package.json`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Broadcaster page route `/broadcaster/[slug]` | Frontend (Client) | Frontend Server (SSR) | Stream host UI is interactive and needs browser media devices; route must still SSR-check auth/role and load doc data. |
| Admin-only guard (redirect/403) | Frontend Server (SSR) + Middleware | — | Middleware can block early (UX), but security must be enforced by server rendering/handlers. |
| Stream call creation/ensure | API / Backend (Route Handler / Server Action) | — | Requires Stream secret (server-only) and must not run in the browser. |
| Publish-capable token minting | API / Backend | — | Security-critical; must enforce admin and mint tokens server-side. |
| Status updates `draft/scheduled/live/ended` | API / Backend | Database/Storage | Payload is source of truth; updates must enforce access rules (overrideAccess false when acting as user). |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `payload` / `@payloadcms/next` | 3.79.1 | Auth + Local API + admin CMS | Already in repo; used by existing `/api/stream/token` pattern. [VERIFIED: `package.json`] |
| `next` | 15.4.11 | Route handlers + middleware + app router | Broadcaster route + API endpoints live here. [VERIFIED: `package.json`] |
| `@stream-io/node-sdk` | 0.7.54 | Server SDK: create calls, upsert users, mint tokens | Already in repo; official docs show `client.video.call(...).getOrCreate`. [VERIFIED: `package.json`] [CITED: https://getstream.io/video/docs/api/calls/] |
| `@stream-io/video-react-sdk` | 1.35.2 | Client SDK + `EmbeddedLivestream` prebuilt UI | Official docs recommend prebuilt for full lifecycle UI. [VERIFIED: npm registry via `npm view @stream-io/video-react-sdk version`] [CITED: https://getstream.io/video/docs/react/basics/prebuilt/] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@stream-io/video-client` | 1.47.0 | Lower-level client used by SDK + logging utilities | Only if you need advanced logging configuration beyond React SDK defaults. [VERIFIED: npm registry via `npm view @stream-io/video-client version`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `EmbeddedLivestream` prebuilt | Manual `StreamVideoClient` + custom UI components | Manual integration gives full UI control but increases planning surface area (providers, call lifecycle, device UX, cleanup). Prebuilt is faster for v1. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/] |

**Installation (project uses pnpm in `package.json`; user preference is bun):**

```bash
pnpm add @stream-io/video-react-sdk
```

```bash
bun add @stream-io/video-react-sdk
```

## Architecture Patterns

### System Architecture Diagram

```text
Browser (admin)                      Next.js (server)                              External
----------------                     ----------------                              --------
GET /broadcaster/[slug]  ───────▶  RSC/SSR load:
                                   - payload.auth(headers)
                                   - fetch livestream by slug
                                   - if !user -> redirect
                                   - if !admin -> 403
                                   - render client broadcaster UI with session doc
                                                │
                                                │ (tokenProvider)
                                                ▼
Client fetch POST /api/stream/broadcaster/token ───────▶ payload.auth + isAdmin
                                                         Stream: upsert user
                                                         Stream: generate publish-capable token
                                                         return { token, expiresAt }
                                                │
                                                │ (Start action)
                                                ▼
Client fetch POST /api/livestreams/[id]/start    ───────▶ payload.auth + isAdmin
                                                         Stream: ensure call exists (getOrCreate)
                                                         Payload: update status=live (only after success)
                                                         return ok
                                                │
                                                │ (End action)
                                                ▼
Client fetch POST /api/livestreams/[id]/end      ───────▶ payload.auth + isAdmin
                                                         (optional) Stream: end call (if used)
                                                         Payload: update status=ended
                                                         return ok
```

### Recommended Project Structure

```text
src/
├── app/(frontend)/
│  ├── broadcaster/[slug]/page.tsx           # server guard + loads livestream doc
│  ├── broadcaster/[slug]/Broadcaster.client.tsx  # EmbeddedLivestream UI + tokenProvider
│  └── api/
│     ├── stream/
│     │  ├── token/route.ts                 # existing member token (keep)
│     │  └── broadcaster-token/route.ts     # new admin-only publish token (name TBD)
│     └── livestreams/
│        └── [id]/
│           ├── start/route.ts              # ensure call exists + status live
│           └── end/route.ts                # status ended (+ optional Stream end)
├── access/
│  └── isAdminUser.ts                       # already exists, reuse
└── lib/stream/
   ├── server.ts                            # already exists, reuse
   └── user.ts                              # already exists, reuse mapping
```

### Pattern 1: Server-side guard via Payload auth (authoritative)

**What:** In `page.tsx` (server component), call `getPayload({ config })` then `payload.auth({ headers })` to determine user. If no user -> redirect to login; if not admin -> render 403.  
**When to use:** All `/broadcaster/*` server entrypoints.  
**Why:** Works even if middleware is bypassed; does not rely on client JS. [VERIFIED: existing pattern in `src/app/(frontend)/api/stream/token/route.ts`]

### Pattern 2: TokenProvider for StreamVideoClient / EmbeddedLivestream

**What:** Use a `tokenProvider` function that fetches a short-lived token from your server; Stream docs recommend this for production and refresh. [CITED: https://getstream.io/video/docs/react/guides/client-auth/]  
**When to use:** Broadcaster page (admin host) so refresh/join works on reload (D-14).  
**Example:** `EmbeddedLivestream` accepts `tokenProvider` and an authenticated `user`. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/]

### Pattern 3: Ensure call exists server-side before prebuilt join

**What:** `EmbeddedLivestream` requires the call to exist; create it on server using Stream server SDK. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/]  
**How (server):** Stream “Calls” API docs show Node usage `client.video.call(callType, callId)` then `call.getOrCreate({ data: ... })` (upsert semantics). [CITED: https://getstream.io/video/docs/api/calls/]

### Pattern 4: Update Payload status safely (don’t bypass access)

**What:** In route handlers, when acting on behalf of the logged-in admin, pass `user` and **must** set `overrideAccess: false` so the same collection access rules are enforced. [VERIFIED: `.cursor/rules/security-critical.mdc`]  
**When to use:** status transitions `live`/`ended`, and any updates to `callId`. [VERIFIED: `src/collections/Livestreams/index.ts` fields + access]

### Anti-Patterns to Avoid

- **Relying on middleware alone for security:** Middleware is not the authoritative gate; always check admin server-side in token/start/end endpoints. [VERIFIED: D-11 in Phase 4 CONTEXT]
- **Using Payload Local API with `user` but without `overrideAccess: false`:** This bypasses access control and breaks the admin-only requirement. [VERIFIED: `.cursor/rules/security-critical.mdc`]
- **Setting `livestreams.status = live` on “Start button click”:** Must update to `live` only after successfully joining as publisher (D-12). [VERIFIED: Phase 4 CONTEXT]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Host/viewer livestream UI | Custom RTC + UI from scratch | `EmbeddedLivestream` | Prebuilt handles lobby/backstage/go-live lifecycle and device UX. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/] |
| Token refresh | Long-lived tokens stored in client | `tokenProvider` returning short-lived tokens | Stream recommends short-lived tokens + provider for auto-refresh. [CITED: https://getstream.io/video/docs/react/guides/client-auth/] |

## Common Pitfalls

### Pitfall 1: “Admin token” still can’t publish
**What goes wrong:** The broadcaster joins but doesn’t see host controls / can’t go live.  
**Why it happens:** Stream call type roles/capabilities aren’t configured (e.g. `JOIN_BACKSTAGE` capability determines host UI in `EmbeddedLivestream`). [CITED: https://getstream.io/video/docs/react/basics/prebuilt/]  
**How to avoid:** Plan a checklist item: configure call type permissions in Stream Dashboard so your admin user role has required host capabilities for callType `livestream`.  
**Warning signs:** Viewer UI renders for admin; missing backstage/go-live controls.

### Pitfall 2: Middleware role check causes latency or infinite loops
**What goes wrong:** `/broadcaster/*` loads slowly or loops redirects due to middleware repeatedly fetching `/api/users/me`.  
**Why it happens:** Middleware runs on every request; naive fetches can be expensive or trigger redirects recursively.  
**How to avoid:** Restrict middleware matcher to `/broadcaster/:path*` only; avoid calling paths that themselves are guarded by the same middleware; set a clear “login” target that’s not under `/broadcaster`. [ASSUMED]  
**Warning signs:** repeated network requests; 307 loops.

### Pitfall 3: Payload status updates bypass security
**What goes wrong:** A non-admin triggers status changes by calling endpoints directly, or server code updates while bypassing access checks.  
**Why it happens:** Missing admin checks or use of Local API defaults.  
**How to avoid:** In every endpoint that mints publish tokens or starts/ends streams: require `payload.auth()` + `isUsersCollectionAdmin(user)`; and when using Local API on behalf of user, set `overrideAccess: false`. [VERIFIED: Phase 4 decisions] [VERIFIED: `.cursor/rules/security-critical.mdc`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next + Payload | ✓ | v22.21.1 | — |
| pnpm | repo scripts (`test`, etc.) | ✓ | 10.32.0 | bun (partial) |
| bun | user preference / some scripts | ✓ | 1.2.14 | pnpm |
| Stream server creds (`STREAM_API_KEY`, `STREAM_API_SECRET`) | token + call creation | ✓ (project already uses) | — | none (blocking if missing) |
| Public api key (`NEXT_PUBLIC_STREAM_API_KEY`) | client SDK init | unknown | — | can reuse `STREAM_API_KEY` value (still public) [ASSUMED] |

**Missing dependencies with no fallback:**
- None detected at machine level; Stream env vars still must be present in runtime.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.config.mts`, `playwright.config.ts` |
| Quick run command | `pnpm run test:int` |
| Full suite command | `pnpm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRD-01 | Admin can start/join publisher via broadcaster flow | e2e | `pnpm run test:e2e` | ❌ (Phase 4 will add) |
| BRD-02 | Non-admin blocked (redirect/403; token route rejects) | integration + e2e | `pnpm run test:int` / `pnpm run test:e2e` | ❌ (Phase 4 will add) |

### Wave 0 Gaps
- [ ] Add a small **integration test** for the new admin-only token route: returns 401 unauthenticated, 403/401 non-admin, 200 admin. (Mock/fixture user auth approach will follow existing test conventions.) [ASSUMED]
- [ ] Add an **E2E** that logs in as admin, visits `/broadcaster/[slug]`, and sees host UI / successfully calls start endpoint. (Requires test user + seeded livestream doc.) [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Payload session cookie + `payload.auth({ headers })` in server code. [VERIFIED: existing `/api/stream/token` route] |
| V3 Session Management | yes | Payload JWT cookie (`payload-token`) forwarded via Next headers/cookies. [VERIFIED: `src/utilities/getMeUser.ts`] |
| V4 Access Control | yes | `isUsersCollectionAdmin` + server-side enforcement + Local API `overrideAccess: false` when operating as user. [VERIFIED: `.cursor/rules/security-critical.mdc`] |
| V5 Input Validation | yes | Validate `slug` and `id` inputs; avoid trusting client-provided doc ids. [ASSUMED] |
| V6 Cryptography | yes | Do not sign tokens manually; use Stream SDK token generation server-side. [CITED: https://getstream.io/video/docs/api/authentication/] |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation (non-admin mint publish token) | Elevation of Privilege | Admin check in route handler + reject non-admin; never expose Stream secret to client. [VERIFIED: Phase 4 decisions] |
| Bypassing Payload access control via Local API defaults | Elevation of Privilege | When passing `user`, always set `overrideAccess: false`. [VERIFIED: `.cursor/rules/security-critical.mdc`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | There is a distinct frontend login route to redirect to (not under `/broadcaster/*`) | Common Pitfalls | Redirect logic could be wrong or loop; planner must confirm actual login URL. |
| A2 | `NEXT_PUBLIC_STREAM_API_KEY` should be introduced for client usage and can equal `STREAM_API_KEY` | Environment Availability | If project uses different env naming or bundling rules, client init could fail. |

## Open Questions (RESOLVED)

1. **Canonical “frontend login” route for middleware redirect**
   - **Resolution:** Redirect unauthenticated users to `/login` as the canonical frontend auth entrypoint for Phase 4, and preserve return-to query so broadcaster navigation can resume post-auth.
   - **Planning impact:** Middleware + server guard tasks in `04-01-PLAN.md` must explicitly encode `/login` redirect behavior for D-02.

2. **End behavior: hard end Stream call vs Payload-only status change**
   - **Resolution:** Phase 4 authoritative requirement is Payload lifecycle correctness per D-13; `/api/livestreams/[id]/end` must always set `status='ended'` on explicit admin action. Stream hard-end (`call.endCall()`) is optional implementation detail and not required to satisfy phase scope.
   - **Planning impact:** Plan tasks require explicit admin-triggered ended transition, while allowing optional Stream call termination if already supported by permissions.

## Sources

### Primary (HIGH confidence)
- `src/app/(frontend)/api/stream/token/route.ts` — existing Payload auth + Stream token minting pattern. [VERIFIED: codebase]
- Payload security rule: Local API needs `overrideAccess: false` with `user`. [VERIFIED: `.cursor/rules/security-critical.mdc`]
- Stream Video React: prebuilt `EmbeddedLivestream` + tokenProvider guidance. [CITED: https://getstream.io/video/docs/react/basics/prebuilt/] [CITED: https://getstream.io/video/docs/react/guides/client-auth/]
- Stream Video Calls API: server call create / `getOrCreate` (Node example). [CITED: https://getstream.io/video/docs/api/calls/]

### Secondary (MEDIUM confidence)
- Stream calls join/leave/end patterns. [CITED: https://getstream.io/video/docs/react/guides/joining-and-creating-calls/]

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — versions verified via `package.json` + `npm view`.
- Architecture: **MEDIUM** — core approach is well supported by docs, but login-route specifics and exact middleware strategy need confirmation in codebase.
- Pitfalls: **MEDIUM** — derived from explicit docs constraints + common Next middleware failure modes (some items assumed).

**Research date:** 2026-04-19  
**Valid until:** 2026-05-19

