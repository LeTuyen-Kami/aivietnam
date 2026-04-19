---
phase: 05-public-viewer
verified: 2026-04-19T18:19:22Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Viewer state UX in browser with real livestream transitions"
    expected: "Scheduled placeholder shows before live, live player appears at go-live, ended placeholder appears after end"
    why_human: "Requires real-time visual behavior and lifecycle timing validation against a running app"
  - test: "Session-expiry redirect flow during active viewing"
    expected: "When token/status endpoint returns 401, viewer is redirected to / with auth=login_required and returnTo back to current /live/[slug]"
    why_human: "Needs browser runtime/navigation confirmation with real auth session expiration"
---

# Phase 5: Public Viewer Verification Report

**Phase Goal:** Người xem mở URL công khai và xem livestream.
**Verified:** 2026-04-19T18:19:22Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Authenticated members can open `/live/[slug]` for an existing livestream. | ✓ VERIFIED | `src/app/(frontend)/live/[slug]/page.tsx` authenticates via `payload.auth`, queries `livestreams` by slug with user-scoped access, and renders `ViewerClient`. |
| 2 | Unauthenticated visitors are redirected to login-required flow with return URL. | ✓ VERIFIED | `page.tsx` redirects to `/?auth=login_required&returnTo=...` when `!user`. |
| 3 | Viewer status is fetched by slug for transition updates while page stays open. | ✓ VERIFIED | `Viewer.client.tsx` polls `/api/livestreams/${encodeURIComponent(slug)}/status`; route `src/app/(frontend)/api/livestreams/[id]/status/route.ts` returns status payload. |
| 4 | Viewer joins Stream call only when livestream is live and token is API-provided. | ✓ VERIFIED | `Viewer.client.tsx` gates connect on `isLiveStatus(statusState.status)` and uses `tokenProvider` with `POST /api/stream/token`, then `join({ create: false })`. |
| 5 | Viewer sees clear pre-live and post-live placeholders. | ✓ VERIFIED | `Viewer.client.tsx` renders explicit Vietnamese copy for `Livestream chưa bắt đầu` and `Livestream đã kết thúc`. |
| 6 | Viewer auto-transitions from scheduled to live via polling. | ✓ VERIFIED | `pollStatus` updates `statusState` every 10s and live lifecycle effect depends on `statusState` values. |
| 7 | Token/session expiry redirects through login-required flow preserving return path. | ✓ VERIFIED | 401 handling in both token provider and status polling calls `redirectToLoginRequired()` preserving current path. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/app/(frontend)/live/[slug]/page.tsx` | Server auth gate + secure slug lookup + client handoff | ✓ VERIFIED | Exists, substantive server logic, wired to `ViewerClient` and `livestreams` collection with `overrideAccess: false`. |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | Status-driven viewer lifecycle | ✓ VERIFIED | Exists, non-stub state machine, polling, tokenProvider, Stream join/leave lifecycle, reconnect and placeholder UX. |
| `src/app/(frontend)/api/livestreams/[id]/status/route.ts` | Authenticated status endpoint | ✓ VERIFIED | Exists, authenticates user, secure slug lookup, returns minimal payload + no-store headers. |
| `tests/int/viewer-page.int.spec.ts` | Contract tests for page auth/access guard | ✓ VERIFIED | Exists and passes; assertions cover redirect contract and secure local API query contract. |
| `tests/int/viewer-client.int.spec.ts` | Contract tests for client lifecycle/auth redirect/UX copy | ✓ VERIFIED | Exists and passes; checks token route usage, live-only gating, cleanup, and state copy. |
| `tests/e2e/viewer.e2e.spec.ts` | Browser smoke validation | ⚠️ ORPHANED | File exists and runs, but second test uses static string assertions rather than real browser state transitions. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/app/(frontend)/live/[slug]/page.tsx` | `src/collections/Livestreams/index.ts` | payload.find + slug filter + access-safe read | WIRED | Query uses `collection: 'livestreams'`, `where.slug.equals`, `user`, and `overrideAccess: false`; collection read access enforces authenticated policy. |
| `src/app/(frontend)/live/[slug]/page.tsx` | `/` | login-required redirect with returnTo | WIRED | Explicit redirect string includes `auth=login_required` and encoded `returnTo`. |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | `/api/stream/token` | tokenProvider for Stream auth/refresh | WIRED | `tokenProvider` fetches `/api/stream/token`, handles 401 redirect, and returns token. |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | `/api/livestreams/[id]/status` | periodic status polling | WIRED | Poll fetch uses slug path every 10s; route exists and responds with status/call data. |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | Stream SDK call lifecycle | live-only join and teardown | WIRED | Uses `join({ create: false })`, `leave()`, and `disconnectUser()` with cleanup paths. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/app/(frontend)/live/[slug]/page.tsx` | `livestream` | `payload.find` against `livestreams` by slug | Yes | ✓ FLOWING |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | `statusState` | Initial props + polling `/api/livestreams/[id]/status` | Yes | ✓ FLOWING |
| `src/app/(frontend)/api/livestreams/[id]/status/route.ts` | response payload (`status`, `callId`, `callType`) | `payload.find` secure read | Yes | ✓ FLOWING |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | Stream token | `/api/stream/token` response token | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Viewer page and client contract tests pass | `bun run test:int -- tests/int/viewer-page.int.spec.ts tests/int/viewer-client.int.spec.ts` | 2 files, 5 tests passed | ✓ PASS |
| Phase code type safety | `bun run tsc --noEmit` | Exit code 0 | ✓ PASS |
| E2E viewer coverage realism | static scan of `tests/e2e/viewer.e2e.spec.ts` | Contains static string assertions for scheduled/live/ended | ⚠️ WARNING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| VIEW-01 | `05-01-PLAN.md`, `05-02-PLAN.md` | Viewer can join livestream UI with API token | ✓ SATISFIED | `page.tsx` auth + secure slug gate, `Viewer.client.tsx` live-only Stream join with tokenProvider, int tests passing. |
| VIEW-02 | `05-02-PLAN.md` | Clear UX before live / after ended | ✓ SATISFIED | `Viewer.client.tsx` scheduled and ended placeholders with explicit copy; contract tests validate text and states. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `tests/e2e/viewer.e2e.spec.ts` | 10-15 | Static string assertions instead of runtime state verification | ⚠️ Warning | Reduces confidence that scheduled/live/ended browser UX transitions are truly exercised end-to-end. |

### Human Verification Required

### 1. Real-time viewer transition UX

**Test:** Login as member, open `/live/[slug]`, then transition livestream status from scheduled to live to ended while page remains open.  
**Expected:** Scheduled placeholder -> live player -> ended placeholder without manual refresh.  
**Why human:** Requires observing runtime visual transitions and real service behavior.

### 2. Session-expiry redirect under active playback

**Test:** While on viewer page, expire/invalidate session and trigger token refresh or status polling.  
**Expected:** Browser redirects to `/?auth=login_required&returnTo=<current-viewer-url>`.  
**Why human:** Requires real auth/session expiration and browser navigation behavior.

### Gaps Summary

No blocking implementation gaps found in must-have truths, artifacts, or key links. Automated and static verification confirms phase goal delivery, with remaining validation limited to human-observable runtime UX and auth-expiry behavior.

---

_Verified: 2026-04-19T18:19:22Z_  
_Verifier: Claude (gsd-verifier)_
