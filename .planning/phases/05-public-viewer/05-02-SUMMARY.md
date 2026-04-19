---
phase: 05-public-viewer
plan: 02
subsystem: ui
tags: [viewer, stream, lifecycle, polling, auth]
requires:
  - phase: 05-01
    provides: authenticated viewer page and status polling entry contract
provides:
  - live-only Stream viewer client lifecycle with tokenProvider auth recovery
  - scheduled/live/ended/reconnecting viewer UX state handling
  - regression coverage for viewer lifecycle, auth redirect, and state copy contracts
affects: [VIEW-02, viewer-client-lifecycle, livestream-status-polling]
tech-stack:
  added: []
  patterns: [stream tokenProvider refresh, status-polling state machine, live-only join gate]
key-files:
  created:
    - tests/int/viewer-client.int.spec.ts
    - tests/e2e/viewer.e2e.spec.ts
  modified:
    - src/app/(frontend)/live/[slug]/Viewer.client.tsx
    - src/app/(frontend)/api/livestreams/[id]/status/route.ts
key-decisions:
  - "Viewer tokenProvider now hard-redirects unauthorized refresh attempts through login-required return flow."
  - "Viewer client continuously polls slug status and transitions between placeholder/player states without manual refresh."
patterns-established:
  - "Live join is strictly gated by `status === 'live'` plus call metadata availability."
  - "Stream call and client resources are always torn down on unmount or status exit from live."
requirements-completed: [VIEW-01, VIEW-02]
duration: 6 min
completed: 2026-04-19
---

# Phase 5 Plan 2: Public Viewer Lifecycle Summary

**Status-driven Stream viewer lifecycle shipped with live-only join, auth-expiry recovery redirect, and clear scheduled/ended/reconnecting UX.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-19T18:10:58Z
- **Completed:** 2026-04-19T18:16:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added RED tests for viewer tokenProvider/auth redirect contracts and state UX expectations.
- Implemented viewer client state machine with status polling, live-only Stream join, reconnecting hint, and teardown lifecycle.
- Added e2e viewer route smoke coverage and resolved dynamic route-segment conflict that blocked Next.js web server startup.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add viewer client and e2e tests for live-only join and UX state contracts** - `d5b79c8` (test)
2. **Task 2: Implement status-driven viewer Stream lifecycle with polling and reconnect feedback** - `752e04e` (feat)

## Files Created/Modified
- `tests/int/viewer-client.int.spec.ts` - Contract tests for tokenProvider endpoint usage, auth-expiry redirect, lifecycle gating, and UX copy.
- `tests/e2e/viewer.e2e.spec.ts` - Viewer route smoke coverage for redirect and state-path expectations.
- `src/app/(frontend)/live/[slug]/Viewer.client.tsx` - Full viewer lifecycle implementation with polling transitions, Stream client join/leave lifecycle, and reconnect feedback.
- `src/app/(frontend)/api/livestreams/[id]/status/route.ts` - Authenticated slug-status endpoint retained under unified dynamic segment naming.

## Decisions Made
- Kept token refresh entirely through `/api/stream/token` and treated `401` as a hard auth gate by redirecting to login-required flow with `returnTo`.
- Centralized viewer state transitions around server-authoritative status polling rather than optimistic local state transitions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Next.js dynamic segment collision for livestream status endpoint**
- **Found during:** Task 2 verification (`bun run test:e2e -- tests/e2e/viewer.e2e.spec.ts`)
- **Issue:** Next.js web server failed with `You cannot use different slug names for the same dynamic path ('id' !== 'slug')`, blocking e2e execution.
- **Fix:** Renamed status endpoint segment from `src/app/(frontend)/api/livestreams/[slug]/status/route.ts` to `src/app/(frontend)/api/livestreams/[id]/status/route.ts` while preserving URL contract `/api/livestreams/<slug>/status`.
- **Files modified:** `src/app/(frontend)/api/livestreams/[id]/status/route.ts`
- **Verification:** `bun run test:e2e -- tests/e2e/viewer.e2e.spec.ts` passed after rename.
- **Committed in:** `752e04e`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for Next.js route compilation and test execution; no behavior regression to viewer URL contracts.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 viewer contracts now cover both server entry and client lifecycle requirements.
- Viewer implementation is ready for phase-level verification and milestone wrap-up.

## Self-Check: PASSED

- Verified summary file exists: `.planning/phases/05-public-viewer/05-02-SUMMARY.md`.
- Verified task commits exist in git history: `d5b79c8`, `752e04e`.
