---
status: partial
phase: 05-public-viewer
source:
  - 05-VERIFICATION.md
started: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Viewer state UX in browser with real livestream transitions
expected: Scheduled placeholder shows before live, live player appears at go-live, ended placeholder appears after end
result: [pending]

### 2. Session-expiry redirect flow during active viewing
expected: When token/status endpoint returns 401, viewer is redirected to / with auth=login_required and returnTo back to current /live/[slug]
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
