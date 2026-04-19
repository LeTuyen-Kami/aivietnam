# Phase 5: Public viewer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 05-public-viewer
**Areas discussed:** Viewer entry/auth flow, Video rendering behavior

---

## Viewer entry/auth flow

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to login with returnTo | Send unauthenticated users to `/` login flow and bounce back to `/live/[slug]` after auth | ✓ |
| Inline login panel | Keep user on page and ask login via in-page CTA | |
| Hard 403 response | Show denied response/page directly | |

**User's choice:** Redirect unauthenticated users with `returnTo`.
**Notes:** Chosen to stay consistent with current route guarding behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| tokenProvider lazy fetch | Use `POST /api/stream/token` on demand and for refresh | ✓ |
| One-time server token pass | Fetch once on server and hand to client | |
| Client cached token | Fetch once and cache in client storage/state | |

**User's choice:** tokenProvider lazy fetch.
**Notes:** Keeps parity with existing Stream SDK pattern and refresh behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| Payload read with `overrideAccess: false` | Use server Local API read with user context and access enforcement | ✓ |
| Admin bypass + manual gate | Bypass collection access then gate in page logic | |
| Internal API hop | Add intermediate API for read operation | |

**User's choice:** Server Local API read with enforced access.
**Notes:** Access control remains centralized in collection rules.

| Option | Description | Selected |
|--------|-------------|----------|
| `String(user.id)` + payload display fields | Keep existing Stream user identity mapping | ✓ |
| Temporary slug/session viewer id | Use non-stable route/session-derived identity | |
| Generic minimal identity | Avoid user metadata details | |

**User's choice:** Reuse existing payload-to-Stream identity mapping.
**Notes:** Reduces identity fragmentation.

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect on token 401 | Route back through login with returnTo | ✓ |
| Inline session-expired message | Ask user to log in in-page | |
| Silent retries only | Retry without immediate UX feedback | |

**User's choice:** Redirect on token 401.
**Notes:** Preserves predictable auth recovery.

| Option | Description | Selected |
|--------|-------------|----------|
| Server/API checks are source of truth | Keep middleware optional for optimization | ✓ |
| Add `/live/*` middleware now | Enforce early redirect at middleware layer | |
| No redirects; page-only denial | Keep requests on page and show denial | |

**User's choice:** Server/API checks as source of truth.
**Notes:** Middleware expansion is optional and not required for phase success.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep upsert in token route | No extra pre-sync endpoint | ✓ |
| Separate sync endpoint | Add explicit pre-join user sync API | |
| No viewer upsert | Assume user exists in Stream | |

**User's choice:** Keep upsert in token route.
**Notes:** Avoids extra API complexity.

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic authenticated route (no shared cache) | Treat viewer data as private/session-scoped | ✓ |
| Short shared cache | Briefly cache viewer data for all users | |
| Aggressive client cache | Persist viewer data between sessions | |

**User's choice:** Dynamic authenticated route behavior.
**Notes:** Matches private auth semantics.

---

## Video rendering behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Join only when `status=live` | Do not create/join Stream call for non-live states | ✓ |
| Always attempt readonly join | Try to join regardless of status | |
| Join on explicit click | Require manual watch CTA before join | |

**User's choice:** Join only for live status.
**Notes:** Prevents noisy errors in pre-live and ended states.

| Option | Description | Selected |
|--------|-------------|----------|
| SDK default auto-reconnect | Let Stream SDK reconnect and show light feedback | ✓ |
| Manual reconnect button | No automatic recovery | |
| Hard fail + refresh | Force full page refresh after disconnect | |

**User's choice:** SDK default auto-reconnect.
**Notes:** Better continuity for viewers.

| Option | Description | Selected |
|--------|-------------|----------|
| Create on live, cleanup on exit | Tie client lifecycle to live state | ✓ |
| Single page-long client | Keep one client across all states | |
| Global shared singleton | Persist client across routes | |

**User's choice:** Lifecycle tied to live state.
**Notes:** Minimizes stale connections and leaks.

| Option | Description | Selected |
|--------|-------------|----------|
| Poll/refetch and auto-join on live | Transition automatically when stream starts | ✓ |
| Manual refresh required | Ask users to refresh when stream goes live | |
| Static snapshot | No runtime status updates | |

**User's choice:** Poll/refetch then auto-join.
**Notes:** Reduces friction for viewers waiting on scheduled streams.

---

## Claude's Discretion

- Poll cadence and backoff strategy for status updates.
- Exact reconnect/loading microcopy.
- Optional middleware extension for `/live/*`.

## Deferred Ideas

- Anonymous public viewer mode.
- Viewer chat/reactions/VOD enhancements.
