---
status: passed
phase: 03-admin-session-management
verified: 2026-04-19
---

# Phase 3 verification

## Must-haves (ADM-01, ADM-02)

| ID | Check | Result |
|----|--------|--------|
| ADM-01 | List: columns `title`, `slug`, `status`, `scheduledAt`, `updatedAt`; default sort `-updatedAt`; status cells styled; slug column has operational actions | Pass (code review + config grep) |
| ADM-02 | Open + copy absolute viewer URL from list (slug column) and document (`viewerOps`); preview / live preview use `/live/[slug]` via `getLivestreamViewerAbsoluteUrl` | Pass (code review) |
| Build | `pnpm exec tsc --noEmit`; `pnpm run generate:importmap` | Pass |

## Automated

- `pnpm exec tsc --noEmit` — pass
- `pnpm run generate:importmap` — pass

## Human verification (recommended)

- In Payload Admin → Livestreams: confirm list columns, sort, status colors, Open viewer / Copy URL on a row with a slug.
- On document edit: confirm Viewer URL block shows correct absolute URL and actions; use Preview / Live Preview and confirm URL targets public viewer path (404 until Phase 5 is acceptable).
