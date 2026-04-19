---
phase: 05-public-viewer
plan: 01
subsystem: api
tags: [viewer, livestream, auth, payload, stream]
requires:
  - phase: 02-payload-session-model
    provides: livestream access control and status schema
  - phase: 04-broadcaster-admin-only
    provides: livestream status lifecycle for viewer transitions
provides:
  - authenticated `/live/[slug]` server entry with login-required return flow
  - secure slug-based livestream reads using Payload Local API access enforcement
  - authenticated `/api/livestreams/[slug]/status` polling contract for viewer transitions
affects: [05-02, viewer-client-lifecycle, stream-polling]
tech-stack:
  added: []
  patterns: [server-side payload.auth guard, user-scoped payload.find with overrideAccess false, force-dynamic route behavior]
key-files:
  created:
    - tests/int/viewer-page.int.spec.ts
    - src/app/(frontend)/live/[slug]/page.tsx
    - src/app/(frontend)/live/[slug]/Viewer.client.tsx
    - src/app/(frontend)/api/livestreams/[slug]/status/route.ts
  modified: []
key-decisions:
  - "Keep viewer auth enforcement in route/page handlers with login redirect returnTo semantics."
  - "Use slug-based status endpoint with no-store responses for client polling transitions."
patterns-established:
  - "Viewer route mirrors broadcaster guard shape while preserving member-level access."
  - "Status endpoint returns minimal fields (status, callId, callType, slug) for deterministic polling."
requirements-completed: [VIEW-01]
duration: 3 min
completed: 2026-04-20
---

# Phase 5 Plan 1: Public Viewer Server Entry Summary

**Authenticated viewer route and status polling contract shipped with secure slug-based access enforcement and login-required return flow.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-19T18:01:38Z
- **Completed:** 2026-04-19T18:04:38Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added regression contract tests for viewer auth redirect and secure local API query behavior.
- Implemented dynamic `/live/[slug]` server page with `payload.auth` guard and `overrideAccess: false` slug lookup.
- Added authenticated `/api/livestreams/[slug]/status` endpoint returning minimal transition payload with no-store caching.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add viewer page integration contract tests for auth redirect and secure slug query** - `a6f9b3e` (test)
2. **Task 2: Implement server viewer page with authenticated dynamic slug load** - `01bfc62` (feat)
3. **Task 3: Add authenticated slug status endpoint for viewer polling transitions** - `ae4929d` (feat)

## Files Created/Modified
- `tests/int/viewer-page.int.spec.ts` - Contract tests for redirect and secure slug lookup semantics.
- `src/app/(frontend)/live/[slug]/page.tsx` - Viewer server entry with auth, dynamic rendering, and client handoff props.
- `src/app/(frontend)/live/[slug]/Viewer.client.tsx` - Minimal typed client handoff component to satisfy viewer page contract.
- `src/app/(frontend)/api/livestreams/[slug]/status/route.ts` - Authenticated slug status endpoint for polling transitions.

## Decisions Made
- Kept server route/page as source-of-truth for viewer auth checks (no middleware dependency), matching D-06.
- Enforced Payload Local API access safety on all user-scoped livestream reads via `overrideAccess: false`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `Viewer.client.tsx` handoff component**
- **Found during:** Task 2 (server viewer page implementation)
- **Issue:** Plan required `ViewerClient` handoff but no client component file existed, which would block typecheck and route compilation.
- **Fix:** Added a typed minimal `ViewerClient` component and wired expected props from server page.
- **Files modified:** `src/app/(frontend)/live/[slug]/Viewer.client.tsx`, `src/app/(frontend)/live/[slug]/page.tsx`
- **Verification:** `bun run tsc --noEmit` and `bun run test:int -- tests/int/viewer-page.int.spec.ts` pass.
- **Committed in:** `01bfc62`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to fulfill the planned server-to-client handoff contract; no scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VIEW-01 server-side foundation is complete with regression coverage.
- Ready for viewer lifecycle/client-state implementation in `05-02`.

## Self-Check: PASSED

- Verified all key files exist on disk.
- Verified task commit hashes exist in git history: `a6f9b3e`, `01bfc62`, `ae4929d`.
