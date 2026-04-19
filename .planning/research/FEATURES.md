# Features Research

**Domain:** Livestream product surface  
**Researched:** 2026-04-19

## Table Stakes (v1 expectation)

- **Admin**: Create a named live session; see status (scheduled / live / ended); obtain or link ingest/playback info from Mux.
- **Viewer**: Open a stable watch URL; see video; know when room is full (50).
- **Engagement**: Post short comments; send heart/reaction events visible to others in-session.

## Differentiators (optional v1+)

- Replay / highlight clip after session (Mux asset archival) — defer if not requested.
- Moderation queue for comments — consider if public abuse risk is high.

## Anti-Features / Defer

- Unlimited concurrent viewers — explicitly out of scope (cap 50).
- Multi-language live UI — defer unless required.

## Dependencies Between Features

- Viewer cap enforcement **depends on** a consistent definition of “viewer” (tab open? playing? heartbeat?).
- Realtime comments **depends on** transport choice (polling MVP vs WebSocket).
