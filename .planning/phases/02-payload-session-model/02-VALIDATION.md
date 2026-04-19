---
phase: 2
slug: payload-session-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `pnpm exec vitest run --config ./vitest.config.mts` |
| **Full suite command** | `pnpm run test:int` |
| **Estimated runtime** | ~30–120 seconds (project-dependent) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec tsc --noEmit` and targeted `vitest` when tests are added
- **After every plan wave:** Run `pnpm run test:int`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1 | 02-01 | 1 | CMS-01 | T-2-01 | Schema matches locked fields | tsc + grep | `pnpm exec tsc --noEmit` | ⬜ | ⬜ pending |
| 1 | 02-02 | 2 | CMS-02 | T-2-02 | No anon read; draft admin-only | grep / manual | `rg "not_equals: 'draft'" src/collections/Livestreams` | ⬜ | ⬜ pending |
| 2 | 02-02 | 2 | CMS-01 | — | DB schema applied | CLI | `CI=true PAYLOAD_MIGRATING=true pnpm payload migrate` | ⬜ | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Existing `vitest.config.mts` — no new framework install
- [ ] Optional new `tests/int/*livestream*.spec.ts` if planner adds coverage for access helpers

*If no new test file: structural grep + `tsc` + migrate + Admin smoke test per PLAN.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|---------------------|
| Non-admin cannot list draft livestreams in Admin/API | CMS-02 | Needs two users + DB | Create draft as admin; log in as non-admin; confirm draft not visible |
| Authenticated member sees scheduled/live/ended | CMS-02 | Session | Create non-draft session; member read returns doc |

---

## Validation Sign-Off

- [ ] All tasks have `<acceptance_criteria>` with grep/tsc/migrate commands
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0

**Approval:** pending
