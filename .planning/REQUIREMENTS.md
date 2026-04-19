# Requirements: Livestream (Mux) milestone

**Defined:** 2026-04-19  
**Core Value:** Stable live viewing plus in-session engagement (comment + hearts) with a clear 50-viewer cap and admin-controlled sessions.

## v1 Requirements

### Integration — Mux & Payload

- [ ] **MUX-01**: Project has `@oversightstudio/mux-video` configured in Payload with required env vars (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SERVER_URL` / `cors_origin`) and webhook route reachable as documented by the plugin.
- [ ] **MUX-02**: After schema changes, generated types and import map are updated (`generate:types`, `generate:importmap` as needed).

### Live session domain

- [ ] **SESS-01**: Admin can create and update a **live session** document (title, scheduling/status fields, and linkage fields for Mux playback/stream IDs as determined in planning).
- [ ] **SESS-02**: Only users with **admin** (or explicitly configured) role can create/update/delete live session documents via API and admin UI.
- [ ] **SESS-03**: Public can read **non-sensitive** session fields needed for the watch page (e.g. title, status, playback identifier) per access rules; secrets (e.g. RTMP stream keys) are not exposed to public read.

### Admin experience

- [ ] **ADM-01**: There is an **admin-facing** flow to create/manage a live session (Payload admin and/or a dedicated Next route restricted to admins — implementation choice in PLAN).
- [ ] **ADM-02**: Admin can distinguish session states relevant to going live and ending (e.g. draft / live / ended — exact enum in PLAN).

### Viewer experience

- [ ] **VIEW-01**: A **public watch page** loads the session by stable identifier (slug or id) and renders Mux-backed **live-appropriate** playback (implementation must match confirmed Mux Live vs VOD approach).
- [ ] **VIEW-02**: When **concurrent viewers** reach **50**, additional viewers are **refused or waitlisted** with a clear message (exact UX in PLAN; count definition documented).

### Engagement

- [ ] **ENG-01**: Authenticated or anonymous users (per decision in `/gsd-discuss-phase`) can **post comments** tied to a live session; comments appear to other participants within acceptable latency (target: near-realtime).
- [ ] **ENG-02**: Users can send **heart / reaction** events during the session; other clients see reactions (minimal viable: burst counter or feed — detail in PLAN).

## v2 Requirements

### Moderation & quality

- **MOD-01**: Slow mode, keyword filter, or admin delete for live comments.  
- **MOD-02**: Optional replay / on-demand recording surfaced from Mux asset post-session.

### Scale

- **SCA-01**: Raise concurrent viewer cap beyond 50 with infrastructure justification.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-first v1 |
| Paid tickets / DRM | Not requested |
| Multi-host layouts (Zoom-style) | Complexity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MUX-01 | Phase 1 | Pending |
| MUX-02 | Phase 1 | Pending |
| SESS-01 | Phase 2 | Pending |
| SESS-02 | Phase 2 | Pending |
| SESS-03 | Phase 2 | Pending |
| ADM-01 | Phase 3 | Pending |
| ADM-02 | Phase 3 | Pending |
| VIEW-01 | Phase 4 | Pending |
| VIEW-02 | Phase 4 | Pending |
| ENG-01 | Phase 5 | Pending |
| ENG-02 | Phase 5 | Pending |

**Coverage:**  
- v1 requirements: 11 total  
- Mapped to phases: 11  
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*  
*Last updated: 2026-04-19 after GSD new-project*
