---
phase: 3
slug: admin-session-management
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-19
---

# Phase 3 — Validation Strategy

> Feedback sampling for Admin UI work (list cells, preview URLs, import map).

---

## Test infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (`pnpm run test:int`) + Playwright (`pnpm run test:e2e`) |
| **Config file** | `vitest.config.mts`, `playwright.config.ts` |
| **Quick run command** | `pnpm exec tsc --noEmit` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~2–10 minutes (depends on e2e) |

---

## Sampling rate

- **After every task commit:** `pnpm exec tsc --noEmit`
- **After wave 1:** `pnpm run lint` (if touched TS/TSX) + manual Admin smoke (see below)
- **Before `/gsd-verify-work`:** Full `pnpm run test` if e2e added; otherwise tsc + manual UAT

---

## Per-task verification map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure behavior | Test type | Automated command | File exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | ADM-01, ADM-02 | T-3-01 | Admin-only collection unchanged | tsc | `pnpm exec tsc --noEmit` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | ADM-01 | — | N/A | tsc + manual | tsc + Admin UI | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | ADM-02 | T-3-02 | URLs are public viewer only; no secrets in cells | tsc + manual | tsc + clipboard/open | ✅ | ⬜ pending |
| 3-01-04 | 01 | 1 | ADM-01/02 | — | import map integrity | CLI | `pnpm generate:importmap` | ✅ | ⬜ pending |

---

## Wave 0 requirements

- Existing Vitest/Playwright cover repo; **no new Wave 0 stubs required** unless executor adds unit tests for URL helpers.
- Optional: unit test for `generateLivestreamViewerPath` encoding edge cases.

---

## Manual-only verifications

| Behavior | Requirement | Why manual | Test instructions |
|----------|-------------|------------|-------------------|
| Status cell colors | ADM-01 | Visual | Open Livestreams list; confirm four statuses visually distinct |
| Copy URL | ADM-02 | Clipboard API | Click Copy on a row with slug; paste in address bar (expect `/live/...` absolute) |
| Preview button | ADM-02 | Admin integration | Open document; use Preview / Live Preview; expect viewer path (404 OK until Phase 5) |

---

## Validation sign-off

- [ ] All tasks have automated verify or documented manual steps
- [ ] `nyquist_compliant: true` when manual checklist attached to UAT
- [ ] No watch-mode in CI commands

**Approval:** pending
