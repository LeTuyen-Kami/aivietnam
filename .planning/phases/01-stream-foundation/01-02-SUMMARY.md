---
phase: 01-stream-foundation
plan: "02"
subsystem: api
tags: [stream, jwt, payload-auth, vitest]

requires:
  - phase: 01-01
    provides: Stream SDK on server, env typings
provides:
  - "Lazy StreamClient singleton (getStreamServerClient)"
  - "POST /api/stream/token returning token + expiresAt for logged-in users"
  - "streamUserIdFromPayloadUser + vitest coverage (STRM-03)"
affects: []

tech-stack:
  added: []
  patterns: ["payload.auth + getSiteMemberUser for token route", "String(user.id) as Stream user_id"]

key-files:
  created:
    - src/lib/stream/server.ts
    - src/lib/stream/user.ts
    - src/app/(frontend)/api/stream/token/route.ts
    - tests/int/stream-user-id.int.spec.ts
  modified: []

key-decisions:
  - "401 when no session or when user is not a site member (users collection)."
  - "upsertUsers on each token request with id + display name (D-02)."

patterns-established:
  - "Stream modules under src/lib/stream/ with server-only entry for the client singleton."

requirements-completed: [STRM-01, STRM-02, STRM-03]

duration: 25min
completed: 2026-04-19
---

# Phase 1: Stream foundation — Plan 01-02 Summary

**Implemented an authenticated Stream token endpoint with a lazy server `StreamClient`, Payload session checks, user upsert, and tests for `String(user.id)` mapping.**

## Performance

- **Tasks:** 4
- **Files created:** 4

## Accomplishments

- `getStreamServerClient()` throws if `STREAM_API_KEY` / `STREAM_API_SECRET` are missing (clear `STREAM_API` error text).
- `POST /api/stream/token` uses `payload.auth`, returns 401 for anonymous or non–site-member sessions, upserts the Stream user, returns JWT + ISO `expiresAt`.
- Vitest covers numeric and string `user.id` mapping for STRM-03.

## Self-Check: PASSED

- `pnpm exec tsc --noEmit`
- `pnpm exec vitest run tests/int/stream-user-id.int.spec.ts --config ./vitest.config.mts`
