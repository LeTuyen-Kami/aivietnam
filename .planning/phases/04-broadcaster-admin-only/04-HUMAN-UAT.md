---
status: partial
phase: 04-broadcaster-admin-only
source: [04-VERIFICATION.md]
started: 2026-04-19T16:37:47Z
updated: 2026-04-19T16:37:47Z
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
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
