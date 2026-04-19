---
phase: 05
slug: public-viewer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Playwright 1.x |
| **Config file** | `vitest.config.mts`, `playwright.config.ts` |
| **Quick run command** | `pnpm run test:int -- tests/int/viewer-page.int.spec.ts tests/int/viewer-client.int.spec.ts` |
| **Full suite command** | `pnpm run test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm run test:int -- tests/int/viewer-page.int.spec.ts tests/int/viewer-client.int.spec.ts`
- **After every plan wave:** Run `pnpm run test:int`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | VIEW-01 | T-05-01 | `/live/[slug]` requires authenticated user and preserves `returnTo` on redirect | integration | `pnpm run test:int -- tests/int/viewer-page.int.spec.ts -t "redirect unauthenticated"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | VIEW-01 | T-05-02 | Viewer slug lookup uses Payload Local API with `user` + `overrideAccess: false` | integration | `pnpm run test:int -- tests/int/viewer-page.int.spec.ts -t "enforce overrideAccess false"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | VIEW-01, VIEW-02 | T-05-03 | Client joins Stream call only when status is `live`; cleans up on transition/unmount | integration | `pnpm run test:int -- tests/int/viewer-client.int.spec.ts -t "join only in live state"` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | VIEW-02 | T-05-04 | Scheduled and ended placeholders plus reconnecting hint render correctly | integration | `pnpm run test:int -- tests/int/viewer-client.int.spec.ts -t "render lifecycle states"` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | VIEW-01, VIEW-02 | T-05-05 | Browser flow validates route + viewer UX transitions end-to-end | e2e | `pnpm run test:e2e -- tests/e2e/viewer.e2e.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/int/viewer-page.int.spec.ts` — auth gate, redirect contract, and secure slug query checks for VIEW-01
- [ ] `tests/int/viewer-client.int.spec.ts` — live-only join, placeholder transitions, reconnect hint checks for VIEW-01/VIEW-02
- [ ] `tests/e2e/viewer.e2e.spec.ts` — smoke flow for scheduled -> live -> ended viewer UX

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real Stream media playback quality under unstable network | VIEW-01, VIEW-02 | CI cannot deterministically emulate production network/media conditions | Start a real livestream as admin, open `/live/[slug]` as member, throttle network, verify reconnect copy and auto-recovery behavior |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
