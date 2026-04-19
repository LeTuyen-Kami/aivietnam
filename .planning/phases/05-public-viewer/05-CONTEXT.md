# Phase 5: Public viewer - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the authenticated public viewer at `/live/[slug]` so members can open a livestream URL, join as read-only when the session is live, and see clear UX states before live and after ended. This phase covers VIEW-01 and VIEW-02 and does not add anonymous viewing or broadcaster capabilities.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and requirements
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and planned slices (`05-01`, `05-02`).
- `.planning/REQUIREMENTS.md` — VIEW-01 and VIEW-02 requirement definitions.
- `.planning/PROJECT.md` — Core value, security constraints, and v1 scope boundaries.

### Locked prior phase context
- `.planning/phases/01-stream-foundation/01-CONTEXT.md` — token route contract and Stream user mapping strategy.
- `.planning/phases/02-payload-session-model/02-CONTEXT.md` — `livestreams` read access model and status semantics.
- `.planning/phases/03-admin-session-management/03-CONTEXT.md` — viewer URL contract `/live/[slug]`.
- `.planning/phases/04-broadcaster-admin-only/04-CONTEXT.md` — broadcaster lifecycle writes (`live`/`ended`) consumed by viewer UX.

### Implementation touchpoints
- `src/collections/Livestreams/index.ts` — collection access control, status values, and preview URL behavior.
- `src/utilities/livestreamViewerUrl.ts` — canonical viewer path/absolute URL helpers.
- `src/app/(frontend)/api/stream/token/route.ts` — member-auth token endpoint and upsert flow.
- `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx` — existing Stream React SDK lifecycle pattern to adapt for viewer.
- `src/app/(frontend)/api/livestreams/[id]/start/route.ts` — source of `live` state transition.
- `src/app/(frontend)/api/livestreams/[id]/end/route.ts` — source of `ended` state transition.
- `src/lib/stream/publicClientEnv.ts` — public Stream API key contract for client setup.
- `src/middleware.ts` — current auth/role middleware pattern reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `POST /api/stream/token` already provides authenticated Stream token minting with user upsert.
- `getLivestreamViewerPath()` and `getLivestreamViewerAbsoluteUrl()` already encode the `/live/[slug]` contract.
- Broadcaster Stream SDK wiring (`StreamVideoClient`, `StreamCall`, `LivestreamLayout`, cleanup) can be adapted for viewer mode.

### Established Patterns
- Server-side auth uses `payload.auth({ headers })` and Local API with `overrideAccess: false` when passing user.
- Livestream status lifecycle is persisted in Payload (`draft`/`scheduled`/`live`/`ended`) and used for behavior gating.
- Public client env setup checks are centralized in `publicClientEnv` helper.

### Integration Points
- New route/page implementation at `src/app/(frontend)/live/[slug]/page.tsx` (or equivalent) reads livestream by slug.
- Viewer UI reacts to status transitions written by existing broadcaster start/end endpoints.
- Stream token refresh remains delegated to existing token endpoint via `tokenProvider`.

</code_context>

<specifics>
## Specific Ideas

- Keep auth, tokening, and user identity behavior consistent with existing broadcaster flow to reduce divergence.
- Prioritize deterministic state transitions (`scheduled` to `live` to `ended`) over optimistic UI assumptions.

</specifics>

<deferred>
## Deferred Ideas

- Anonymous/public viewer access without login (would change Phase 2 access model and is out of v1 scope).
- Rich viewer enhancements (chat sidebar, reactions, DVR/VOD playback) are future capability phases.

</deferred>

---

*Phase: 05-public-viewer*
*Context gathered: 2026-04-20*
