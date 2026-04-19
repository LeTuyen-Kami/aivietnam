# Roadmap: Livestream (Mux) milestone

**Project:** AI Vietnam — Livestream initiative  
**Created:** 2026-04-19  
**Granularity:** Standard (5 phases)

## Overview

| # | Phase | Goal | Requirements | Success criteria (count) |
|---|--------|------|----------------|-------------------------|
| 1 | Mux foundation | Plugin + env + webhook + types | MUX-01, MUX-02 | 4 |
| 2 | Live session model | Collection + access + Mux linkage | SESS-01 — SESS-03 | 4 |
| 3 | Admin session UI | Create/manage sessions | ADM-01, ADM-02 | 3 |
| 4 | Watch + viewer cap | Public page + ≤50 concurrent | VIEW-01, VIEW-02 | 4 |
| 5 | Comments & reactions | Near-realtime engagement | ENG-01, ENG-02 | 4 |

---

## Phase 1: Mux foundation

**Goal:** `@oversightstudio/mux-video` installed and configured; webhook verified; codegen updated.

**Requirements:** MUX-01, MUX-02

**UI hint:** no

**Success criteria:**

1. Payload boots with plugin enabled; no config errors at startup.
2. Mux dashboard shows test activity OR webhook receives a test event in dev (documented steps in SUMMARY).
3. `payload-types` / import map reflect new plugin collections/fields.
4. Env template (e.g. `.env.example`) lists required Mux variables.

**Depends on:** —

---

## Phase 2: Live session model

**Goal:** New collection(s) for live sessions with admin-only writes; public read rules; fields for Mux stream/playback linkage after spike.

**Requirements:** SESS-01, SESS-02, SESS-03

**UI hint:** no

**Success criteria:**

1. Live session documents can be created in admin by admin role only.
2. Non-admin cannot mutate session docs via REST/GraphQL (verified with tests or manual checklist).
3. Public read policy exposes only fields required for watch page; secrets excluded.
4. Decision recorded: how Mux **Live** IDs attach to session (link to PLAN.md).

**Depends on:** Phase 1

---

## Phase 3: Admin session UI

**Goal:** Usable admin workflow to create and transition session lifecycle.

**Requirements:** ADM-01, ADM-02

**UI hint:** yes

**Success criteria:**

1. Admin can reach UI (Payload collection UI and/or custom Next admin page) to create a session.
2. Status fields are clear for operators (copy/deck in UAT).
3. Smoke test: create → mark live-ready → end (mock acceptable if ingest not available).

**Depends on:** Phase 2

---

## Phase 4: Watch page + viewer cap

**Goal:** Public watch URL with Mux player; enforce 50 concurrent viewers with shared state + clear “room full” UX.

**Requirements:** VIEW-01, VIEW-02

**UI hint:** yes

**Success criteria:**

1. Watch page renders player for active session using correct playback id/stream approach.
2. Load test or scripted test proves 51st viewer is blocked or waitlisted.
3. Heartbeat/TTL documented so idle tabs release slots.

**Depends on:** Phase 2, Phase 3 (minimum session data)

---

## Phase 5: Comments & reactions

**Goal:** Session-scoped comments and heart-style reactions with acceptable latency.

**Requirements:** ENG-01, ENG-02

**UI hint:** yes

**Success criteria:**

1. Comments posted during session visible to other clients (manual two-browser test).
2. Reactions propagate within agreed latency budget.
3. Basic abuse resistance (rate limit) documented.

**Depends on:** Phase 4 (session identity + viewer presence)

---

## Notes

- **Spike:** If Phase 1 reveals plugin-only VOD path, add a **0.x / decimal phase** or fold **Mux Live API** proof into Phase 1–2 before building admin UI — adjust roadmap via `/gsd-insert-phase` if needed.
