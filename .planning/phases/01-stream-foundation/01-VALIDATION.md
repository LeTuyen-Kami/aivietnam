---
phase: 1
slug: stream-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 1 — Validation Strategy

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

- **After every task commit:** Run `pnpm exec vitest run --config ./vitest.config.mts` (narrow to new tests when possible)
- **After every plan wave:** Run `pnpm run test:int`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1 | 01-01 | 1 | STRM-01 | T-1-01 / — | Secrets only in `.env.example` names, not values | grep | `rg "STREAM_API" .env.example` | ⬜ | ⬜ pending |
| 1 | 01-02 | 2 | STRM-02 | T-1-02 | 401 without session | unit/manual | `vitest` or `curl` per PLAN | ⬜ | ⬜ pending |
| 2 | 01-02 | 2 | STRM-03 | — | Mapping helper pure | unit | `pnpm exec vitest run tests/int/stream-user-id.int.spec.ts` | ⬜ | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `tests/int/stream-user-id.int.spec.ts` — STRM-03 mapping
- [ ] Existing `vitest.config.mts` — no new framework install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Valid JWT from Stream with real credentials | STRM-02 | Needs GetStream dashboard keys | After `.env` filled: `curl -X POST` with session cookie; decode JWT at jwt.io (payload structure) |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or manual table above
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0

**Approval:** pending
