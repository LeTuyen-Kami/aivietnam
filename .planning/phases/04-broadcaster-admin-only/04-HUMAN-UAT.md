---
status: partial
phase: 04-broadcaster-admin-only
source: [04-VERIFICATION.md]
started: 2026-04-19T16:37:47Z
updated: 2026-04-19T16:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Admin broadcaster happy path
expected: Admin can open `/broadcaster/[slug]`, click Start livestream, host UI joins, then End livestream sets ended state.
result: [pending]

### 2. Non-admin and unauth access behavior
expected: Logged-out users are redirected to login with `returnTo`; logged-in non-admin sees denied experience and API returns 403.
result: [pending]

### 3. Refresh tokenProvider rejoin while live
expected: Refreshing a live broadcaster page re-fetches admin token and rejoins publish session without manual re-auth.
result: [pending]

## Summary

total: 3
passed: 0
issues: 1
pending: 2
skipped: 0
blocked: 0

## Gaps

### 1. Missing Stream API key blocks broadcaster UI
status: failed
severity: high
source_test: Refresh tokenProvider rejoin while live
details: `NEXT_PUBLIC_STREAM_API_KEY` is required to run the broadcaster UI in frontend runtime.
expected: Broadcaster UI should be runnable with required environment contract documented and enforced early.
next_action: Add explicit env validation and setup documentation for broadcaster flow.
