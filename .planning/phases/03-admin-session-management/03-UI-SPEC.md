---
phase: 3
slug: admin-session-management
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-19
---

# Phase 3 — UI Design Contract (Payload Admin)

> Visual and interaction contract for **Payload 3 Admin** customization (`livestreams` collection). Scope is the **admin panel** only — not the public site chrome from Phase 5.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Payload Admin (`@payloadcms/ui`) |
| Preset | Payload theme CSS variables (`--theme-*`) |
| Component library | Payload UI primitives + project SCSS |
| Icon library | Match existing admin (if any); optional minimal icons for copy/open |
| Font | Admin default (inherits Payload) |

---

## Spacing & layout

- List cells: compact horizontal layout; actions (open / copy) **inline or trailing** the slug, with **≥ 8px** gap between controls (multiples of 4px).
- Document “viewer” area: **16px** padding in the custom `ui` field block; stack vertically on narrow panels.

---

## Status semantics (ADM-01, D-03)

| `status` value | Visual |
|----------------|--------|
| `draft` | Muted / `--theme-elevation-500` style text |
| `scheduled` | Distinct “planned” (info / secondary emphasis) |
| `live` | Strong emphasis — success or warning token per admin theme (must be visibly “active”) |
| `ended` | Muted, de-emphasized |

Use **Payload CSS variables** from `@payloadcms/ui` / admin theme — do not hardcode arbitrary hex unless matching existing admin patterns.

---

## Typography

| Role | Usage |
|------|--------|
| Cell label (implicit) | Default admin table body |
| Status pill/text | Default weight; optional **semibold** for `live` only |
| Button labels | Short verbs: **Open**, **Copy** (English labels acceptable in admin; match existing Posts admin language if Vietnamese used elsewhere) |

---

## Color

| Role | Usage |
|------|--------|
| Semantic status | Mapped per table above — never rely on color alone; keep **status string** visible |
| Interactive | Default Payload button/link styles for Open / Copy |
| Destructive | N/A for this phase |

---

## Copywriting contract

| Element | Copy |
|---------|------|
| Open viewer (button / link) | `Open viewer` or `Mở trang xem` — **one** primary label per surface |
| Copy URL | `Copy URL` / tooltip “Copy public viewer URL” |
| Clipboard success | Transient feedback: `Copied` or rely on browser default |
| Empty slug | Disable open/copy; show `—` or “No slug” |

---

## Interaction

- **Open viewer:** `target="_blank"` + `rel="noopener noreferrer"` for external absolute URL; internal path may use `Link` if same origin per project rules.
- **Copy URL:** `navigator.clipboard.writeText(fullAbsoluteUrl)` in a **client** component; guard for missing `slug`.
- **Preview / Live Preview:** URLs point to **`/live/[slug]`** (public viewer), **not** `/next/preview` draft flow.

---

## Registry safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Payload official | `admin.components.Cell`, `ui` field, `preview` / `livePreview` | Follow `AGENTS.md` import map regeneration after new component paths |

---

## Checker sign-off (design intent)

- [x] Dimension 1 Copywriting: PASS (labels above)
- [x] Dimension 2 Visuals: PASS (status table + Payload variables)
- [x] Dimension 3 Color: PASS (semantic mapping)
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-19
