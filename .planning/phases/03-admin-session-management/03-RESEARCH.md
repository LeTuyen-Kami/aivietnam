# Phase 3 — Technical Research: Admin session management

**Question:** What do we need to know to plan Payload Admin UX for `livestreams` (list scan, status, viewer links)?

**Status:** Ready for planning  
**Sources:** Payload v3.79.1 docs [CITED], codebase [VERIFIED], assumptions [ASSUMED] where noted.

---

## Executive summary

Extend `src/collections/Livestreams/index.ts` with **`admin.defaultColumns`**, **`defaultSort`** (collection-level sort string) [CITED], **`admin.preview` / `admin.livePreview`** mirroring `Posts` but pointing to **`/live/[slug]`** built from `slug` + `getServerSideURL()` per CONTEXT. Implement **`admin.components.Cell`** on `status` (and optionally `slug`) for scan-friendly UI [CITED]. After adding component paths, run **`pnpm generate:importmap`** and **`pnpm generate:types`** per AGENTS.md [VERIFIED: `.cursor/rules/`, `AGENTS.md`]. No new persisted fields required if list actions are implemented via `Cell` components and optional `ui` field [ASSUMED — confirm during implementation].

---

## Payload Admin: list columns and sort

- **`defaultColumns`**: array of field names shown in list view [CITED: Payload collections reference / project `Posts`].
- **`defaultSort`**: On `CollectionConfig`, use string like `'-updatedAt'` for descending [CITED: `/payloadcms/payload` v3.79.1 — example shows `defaultSort: '-createdAt'` at collection root alongside `fields`].
- CONTEXT D-01/D-02: columns `title`, `slug`, `status`, `scheduledAt`, `updatedAt`; sort **`-updatedAt`**.

---

## Custom list cells

- Register **`admin.components.Cell`** on a field to customize list table rendering [CITED: Payload fields overview v3.79.1].
- **`status`**: Custom Cell applies semantic styling (draft / scheduled / live / ended) per UI-SPEC [CONTEXT D-03].
- **`slug`**: Custom Cell can combine slug display + **Open** (anchor) + **Copy** (client button) to satisfy ADM-02 on the list row [CONTEXT D-05, D-08].

---

## Preview vs public viewer URL

- **`generatePreviewPath`** builds `/next/preview?...` for **draft CMS preview** — **do not reuse** for livestreams viewer [CONTEXT D-07, VERIFIED: `src/utilities/generatePreviewPath.ts`].
- Add a small helper (e.g. `generateLivestreamViewerPath` or `getLivestreamViewerUrls`) returning **pathname** `/live/${encodeURIComponent(slug)}` and optionally **absolute URL** via `getServerSideURL()` [VERIFIED: `src/utilities/getURL.ts`].
- Wire **`admin.preview`** and **`admin.livePreview.url`** to the **viewer** URL pattern, analogous to `Posts` structure in `src/collections/Posts/index.ts` [VERIFIED].

---

## Client vs server components

- Clipboard **requires client** (`'use client'`) for `navigator.clipboard` [ASSUMED: standard browser API].
- Payload **Cell** components may be client components when interactivity is needed; align with existing project patterns for admin components [ASSUMED].

---

## Import map

- Component paths are string paths in config; after adding files under `src/components/...`, run **`pnpm generate:importmap`** [VERIFIED: AGENTS.md].

---

## Database migrations

- This phase **may not** alter persisted schema if only `admin` config + `ui` field + Cells are added [ASSUMED]. If `ui` fields only (no stored data), no new columns [CITED: Payload `ui` field type]. If migration is not required, **`pnpm payload migrate`** may be no-op — still run **`pnpm exec tsc --noEmit`** as gate.

---

## Project constraints (from `.cursor/rules/` / AGENTS.md)

- TypeScript-first; run **`pnpm generate:types`** after schema-relevant changes; this phase focuses on admin — types may still need regeneration if `payload-types` picks collection changes [VERIFIED].
- SmartLink is for **frontend** CMS links; admin operational links here are **explicit** open/copy for `/live/[slug]` [CONTEXT].

---

## Validation Architecture

Nyquist / verification strategy for this phase:

| Layer | What | When |
|-------|------|------|
| Static | `pnpm exec tsc --noEmit` | After each task / commit |
| Admin smoke | Manual: open Payload → Livestreams list — columns, sort, status colors, slug actions, document preview | After implementation |
| E2E (optional backlog) | Playwright admin login + list not covered in minimal phase unless existing pattern | Defer unless REQ mandates |

**Dimension 8 (Nyquist):** Primary automated signal is **tsc** + **lint** if time; **manual** checklist required for visual status and clipboard in real browser (non-headless clipboard quirks).

---

## RESEARCH COMPLETE
