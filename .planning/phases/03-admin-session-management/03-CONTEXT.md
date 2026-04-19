# Phase 3: Admin session management - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

> **Tóm tắt (tiếng Việt):** Phase 3 tập trung **Payload Admin** cho `livestreams`: danh sách dễ quét (cột + sort), **status** có màu, và **liên kết xem** `/live/[slug]` (mở tab + copy URL). **Preview/livePreview** trên document giống hướng Posts nhưng trỏ thẳng **trang viewer** (không phải draft preview của bài). `callId` không nằm cột mặc định — xem ở chi tiết.

<domain>
## Phase Boundary

Improve **Payload Admin** UX for the existing **`livestreams`** collection so operators can **scan sessions and status** (ADM-01) and reach **public viewer / operational URLs** (ADM-02). This phase is **admin UI and collection `admin` config** only — it does **not** implement the public viewer route (Phase 5) or the broadcaster flow (Phase 4); links may 404 until those routes exist.

</domain>

<decisions>
## Implementation Decisions

### List columns (ADM-01)

- **D-01:** **`admin.defaultColumns`:** `title`, `slug`, `status`, `scheduledAt`, `updatedAt` — include **`scheduledAt`** so scheduled sessions are scannable next to status; keep **`callId` off** the default list (too noisy); `callId` remains visible on the document edit view.

### Default list ordering

- **D-02:** Prefer **most recently touched first**: **`updatedAt` descending**. Implement via Payload **`admin.defaultSort`** if supported for this version; if not, document the intended ordering as a planner task (custom list view or accepted default behavior).

### Status at-a-glance (ADM-01)

- **D-03:** Use a **custom Cell** (or equivalent list cell) for **`status`** with **semantic styling** — e.g. draft = neutral/muted, scheduled = distinct “planned” style, live = strong emphasis (success/warning per design system), ended = muted — so operators can scan without reading raw strings.

### Operational links — viewer URL (ADM-02)

- **D-04:** **Public viewer path** follows Phase 2: **`/live/[slug]`** (single segment = `slug` field).

- **D-05:** Provide **both** in admin: **(1) Open viewer** in a **new tab** (external or `target="_blank"` with `rel` as appropriate) and **(2) Copy full URL** (absolute) to clipboard. Base origin from existing **`getServerSideURL()`** in `src/utilities/getURL.ts` (uses `NEXT_PUBLIC_SERVER_URL` / Vercel fallbacks).

- **D-06:** **Stream Dashboard** / external Stream.io console deep-links are **out of scope** for this phase — defer to backlog unless a later requirement explicitly needs them.

### Edit view vs list — preview pattern

- **D-07:** Add **`admin.preview`** and **`admin.livePreview`** on **`livestreams`** so the document view has the same *class* of affordance as **Posts** — but URLs must point to the **public viewer path** `/live/[slug]`, **not** the draft `generatePreviewPath` / `/next/preview` flow (that map is for editorial draft preview). Introduce a small helper (e.g. `generateLivestreamViewerPath` or extend a shared utility) that returns a path or full URL consistent with **D-04–D-05**.

- **D-08:** **List row** and **document** should both allow reaching the viewer URL (list: row actions or dedicated column; document: preview button + optional read-only “Viewer URL” UI — **Claude’s discretion** on exact Payload 3 component shapes).

### Claude's Discretion

- Exact Payload **admin component** paths (`components.Cell`, `BeforeList`, custom field UI) and whether copy uses a **button** vs **icon** — as long as **D-03–D-05** and **D-07** are satisfied.
- Minor tweaks to color mapping for **status** cells to match existing admin theme variables.

### Folded Todos

_None — no matching todos._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 3 goal, ADM-01, ADM-02, plan hint `03-01`
- `.planning/REQUIREMENTS.md` — ADM-01, ADM-02
- `.planning/PROJECT.md` — Admin tooling, Payload conventions

### Prior phases

- `.planning/phases/02-payload-session-model/02-CONTEXT.md` — `livestreams` schema, `status` values, `slug` → `/live/[slug]`, access rules
- `.planning/phases/01-stream-foundation/01-CONTEXT.md` — Token API; not primary for Admin UI but background for ops

### Codebase maps

- `.planning/codebase/CONVENTIONS.md` — Naming, Payload patterns
- `.planning/codebase/STACK.md` — Payload 3, Next.js

### Implementation touchpoints

- `src/collections/Livestreams/index.ts` — Current `admin.defaultColumns` and collection config (extend here + new components)
- `src/collections/Posts/index.ts` — Reference for **`admin.preview` / `livePreview`** shape (adapt URL semantics per **D-07**)
- `src/utilities/generatePreviewPath.ts` — **Do not** reuse for livestream viewer URL (draft preview); compare pattern only
- `src/utilities/getURL.ts` — **`getServerSideURL()`** for absolute viewer links

### External

- Payload CMS docs — `admin.defaultColumns`, `defaultSort`, custom components for list cells and preview

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`Livestreams`** collection already defines `defaultColumns` and fields — extend rather than replace collection.
- **`getServerSideURL()`** — canonical base for absolute operational links.
- **Posts `admin.preview` / `livePreview`** — pattern for wiring preview buttons; swap URL builder for livestream viewer (**D-07**).

### Established Patterns

- Payload **custom components** live under `src/components/` and are referenced by path from collection config; **import map** regeneration may be needed after adding components.

### Integration Points

- Viewer path **`/live/[slug]`** will be implemented in **Phase 5**; until then, admin links are still valid for operators (may 404 in dev until the route exists).

</code_context>

<specifics>
## Specific Ideas

- User chose to discuss **all four** gray areas; decisions above use the **recommended** package aligned with ADM-01/02 and Phase 2 slug contract.

</specifics>

<deferred>
## Deferred Ideas

- **Stream.io dashboard** / call-inspector deep links — not part of Phase 3 (**D-06**).
- **Broadcaster / publish URL** (Phase 4) — separate phase; do not block admin viewer links.

</deferred>

---

*Phase: 03-admin-session-management*  
*Context gathered: 2026-04-19*
