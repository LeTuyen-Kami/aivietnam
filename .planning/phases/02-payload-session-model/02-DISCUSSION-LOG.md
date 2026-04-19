# Phase 2: Payload session model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `02-CONTEXT.md`.

**Date:** 2026-04-19  
**Phase:** 2 — Payload session model  
**Areas discussed:** Public read & API exposure, Status lifecycle, Field set beyond minimum, Slug & routing contract

---

## Selection

**User's choice:** Discuss **all** gray areas (`all`).

**User's choice (access):** **Chỉ đăng nhập mới được xem** — only **authenticated** users may read session documents; **anonymous** users have **no** read access. Draft sessions remain **admin-only** for read.

---

## Public read & API exposure

| Option | Description | Selected |
|--------|-------------|----------|
| Authenticated-only (non-draft for members) | Anonymous: no read; logged-in: read non-draft; admin: all | ✓ |
| Public by slug (anonymous OK) | Would match “công khai” — rejected by user | |
| Admin read-only for everyone | Too restrictive for logged-in viewers | |

**User's choice:** Authenticated-only model (see CONTEXT D-07–D-10).  
**Notes:** Aligns CMS-02 with explicit login requirement for viewing session data.

---

## Status lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| draft / scheduled / live / ended | Matches roadmap Phase 3 language | ✓ |
| Minimal two-state | Too coarse for ops | |

**User's choice:** Four-state enum; draft hidden from non-admin readers.

---

## Field set beyond minimum

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum + optional description + scheduledAt | Phase 2 usable for scheduling + viewer copy | ✓ |
| Absolute minimum only | Possible; planner preferred small optional fields | |

**User's choice:** Required fields per CMS-01; optional `description`, `scheduledAt`; no required thumbnail in Phase 2 (Claude discretion).

---

## Slug & routing contract

| Option | Description | Selected |
|--------|-------------|----------|
| Unique slug + slugifyTitle when empty | Matches Posts pattern; admin override | ✓ |
| Manual slug only | More friction for admins | |

**User's choice:** Unique slug for `/live/[slug]`; auto from title via `slugifyTitle` when empty.

---

## Claude's Discretion

- Exact `access.read` implementation shape in Payload  
- Slug collision behavior  
- Optional validation: `scheduled` requires `scheduledAt`

## Deferred Ideas

- Public anonymous viewing — deferred / contradicted by user requirement for v1  
- Extra media fields — deferred to later phases unless scope changes
