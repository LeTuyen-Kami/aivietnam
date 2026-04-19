---
phase: 03-admin-session-management
plan: "01"
subsystem: ui
tags: [payload, admin, livestream]

requires:
  - phase: 02-payload-session-model
    provides: livestreams collection and session fields
provides:
  - Viewer URL helpers for /live/[slug]
  - Livestreams list columns, status styling, slug actions
  - Admin preview and live preview targeting public viewer URL
  - Document-level viewerOps UI field
affects: [phase-4, phase-5]

tech-stack:
  added: []
  patterns:
    - Payload admin Cell components for list view
    - UI field for read-only operational links

key-files:
  created:
    - src/utilities/livestreamViewerUrl.ts
    - src/components/Livestreams/LivestreamStatusCell.tsx
    - src/components/Livestreams/LivestreamSlugActionsCell.tsx
    - src/components/Livestreams/LivestreamViewerLinksField.tsx
  modified:
    - src/collections/Livestreams/index.ts
    - src/app/(payload)/admin/importMap.js

key-decisions:
  - "defaultSort lives on CollectionConfig root (not admin) per Payload 3 types."
  - "Slug row override merges Cell into nested slug text field via overrides callback."

patterns-established:
  - "Preview URLs for livestreams use getLivestreamViewerAbsoluteUrl, not generatePreviewPath."
  - "Document viewerOps UI field reads slug via useField({ path: 'slug' })."

requirements-completed: [ADM-01, ADM-02]

duration: 25min
completed: 2026-04-19
---

# Phase 3: Admin session management — Plan 01 Summary

**Operators get a sorted Livestreams list with clear status styling and open/copy actions for the public viewer URL from both list and document views, with preview buttons targeting `/live/[slug]`.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 4
- **Files modified:** 6 (including generated import map)

## Accomplishments

- Added `getLivestreamViewerPath` / `getLivestreamViewerAbsoluteUrl` built on `getServerSideURL()` with safe slug encoding.
- List view: status cell uses theme variables; slug column shows open + copy for absolute viewer URL.
- Collection: `defaultSort: '-updatedAt'`, columns per CONTEXT D-01, `preview` / `livePreview` wired to viewer URL; `viewerOps` UI field on the edit form.
- Regenerated Payload import map; `pnpm exec tsc --noEmit` passes.

## Task Commits

1. **Task 1: Viewer URL helpers** — `de2a4eb` (feat)
2. **Task 2: Status and slug admin cells** — `856197a` (feat)
3. **Task 3: Document viewer UI field + collection admin config** — `a8034ab` (feat)
4. **Task 4: Import map** — `03f1496` (chore)
5. **Follow-up: useField for viewer slug** — `71748d6` (fix)

## Files Created/Modified

- `src/utilities/livestreamViewerUrl.ts` — Public viewer path and absolute URL helpers.
- `src/components/Livestreams/LivestreamStatusCell.tsx` — List cell for status styling.
- `src/components/Livestreams/LivestreamSlugActionsCell.tsx` — Slug + open/copy in list.
- `src/components/Livestreams/LivestreamViewerLinksField.tsx` — Document panel for viewer URL.
- `src/collections/Livestreams/index.ts` — Admin defaults, preview, cells, UI field.
- `src/app/(payload)/admin/importMap.js` — Import map entries for new components.

## Verification

- `pnpm exec tsc --noEmit`: PASS (after fixes)
- `pnpm run generate:importmap`: PASS
- `pnpm run generate:types`: PASS
- `CI=true PAYLOAD_MIGRATING=true pnpm payload migrate`: not completed (command did not finish in environment; UI field is non-persisted — no DB schema change expected for this work)

## Deviations

- None.

## Self-Check: PASSED
