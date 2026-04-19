---
phase: 4
slug: broadcaster-admin-only
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + playwright |
| **Config file** | `vitest.config.mts`, `playwright.config.ts` |
| **Quick run command** | `bun run test:int` |
| **Full suite command** | `bun run test` |
| **Estimated runtime** | ~unknown (project-dependent) |

---

## Sampling Rate

- **After every task commit:** Run `bun run test:int`
- **After every plan wave:** Run `bun run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** unknown

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | BRD-02 | — | Non-admin requests cannot mint publish token; endpoints enforce admin server-side | integration | `bun run test:int` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | BRD-01 | — | Admin can start/join publisher; call exists; status transitions recorded | e2e | `bun run test:e2e` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add/extend integration tests to cover admin-only token + start/end endpoints
- [ ] Add/extend e2e test that logs in as admin and exercises `/broadcaster/[slug]`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stream Dashboard call-type host permissions (capabilities) allow admin to publish/go-live | BRD-01 | External dashboard configuration | Verify `livestream` call type grants host capabilities for your admin users; open `/broadcaster/[slug]` and confirm host controls/backstage/go-live appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < unknown
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

