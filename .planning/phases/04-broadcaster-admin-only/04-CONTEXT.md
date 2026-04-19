# Phase 4: Broadcaster (admin-only) - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the **frontend site** flow where an **admin** can start a Stream Video `livestream` session (join with **publish**) for an existing `livestreams` document, and ensure **state is recorded back into Payload**. Non-admin users must **not** be able to successfully call create/join-publish APIs. This phase does **not** implement the public viewer page (Phase 5) and does not expand product scope to allow non-admin broadcasters (deferred).

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 4 goal, BRD-01/BRD-02, plan hints `04-01`, `04-02`
- `.planning/REQUIREMENTS.md` — BRD-01, BRD-02 definitions
- `.planning/PROJECT.md` — security constraints, v1 scope (admin-only broadcasting)

### Prior phase context (locked)

- `.planning/phases/01-stream-foundation/01-CONTEXT.md` — token API contract and Payload→Stream user mapping
- `.planning/phases/02-payload-session-model/02-CONTEXT.md` — `livestreams` schema, access model, statuses, `callType=livestream`, slug contract
- `.planning/phases/03-admin-session-management/03-CONTEXT.md` — admin ops links and viewer URL patterns (Phase 4 may add broadcaster deep link similarly)

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md` — route groups, RSC vs route handlers
- `.planning/codebase/STACK.md` — Next 15, Payload 3, patterns

### Implementation touchpoints (existing code)

- `src/collections/Livestreams/index.ts` — `livestreams` collection fields (`callId` required), access rules, status options
- `src/app/(frontend)/api/stream/token/route.ts` — current member token minting route (keep for viewers)
- `src/lib/stream/server.ts` — server-only Stream client singleton
- `src/lib/stream/user` — Stream user id + display name mapping (used by token routes)
- `src/access/isAdminUser.ts` — canonical admin role helper
- `src/access/siteMemberUser.ts` — member guard used by `/api/stream/token`
- `src/utilities/livestreamViewerUrl.ts` — viewer URL contract `/live/[slug]` (Phase 5)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `getStreamServerClient()` in `src/lib/stream/server.ts` — server-side Stream SDK client for user upsert + token minting.
- Token route `src/app/(frontend)/api/stream/token/route.ts` — pattern for Payload auth via `payload.auth({ headers })`.
- `Livestreams` collection (`src/collections/Livestreams/index.ts`) — already encodes status options and access rules; Phase 4 should update docs through Payload Local API with `overrideAccess: false` when user is passed.

### Established Patterns

- Custom site APIs live under `src/app/(frontend)/api/**`.
- Access helpers (`src/access/*`) centralize role checks; reuse them in middleware + server handlers.

### Integration Points

- Broadcaster page under `src/app/(frontend)/...` will query `livestreams` by `slug` and coordinate with Stream Video React SDK (Phase 4 UI).
- Payload Admin already has viewer links; Phase 4 can add broadcaster deep-link without changing the underlying `livestreams` model.

</code_context>

<specifics>
## Specific Ideas

- Broadcaster route `/broadcaster/[slug]` should remain stable even if a future phase enables non-admin broadcasting (deferred).

</specifics>

<deferred>
## Deferred Ideas

- Allow **non-admin users** to broadcast (v2 requirement `NONADMIN-01`).

</deferred>

---
*Phase: 04-broadcaster-admin-only*  
*Context gathered: 2026-04-19*

