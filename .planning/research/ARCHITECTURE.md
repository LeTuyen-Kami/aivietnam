# Architecture Research

**Domain:** Livestream + Payload + Next.js  
**Researched:** 2026-04-19

## Components

1. **Payload CMS**  
   - Plugin `mux-video`: `mux-video` collection, webhook handler for asset lifecycle.  
   - **New** `live-sessions` (or similar) collection: title, slug, status, `muxLiveStreamId` / `playbackId` fields (exact shape after Mux Live vs VOD decision), admin-only `create/update`.

2. **Next.js**  
   - **Admin route**: `/admin/...` is Payload; optional **frontend** route e.g. `/live/admin/[...]` with server check `user.roles` OR rely on Payload admin for session CRUD only — product decision.  
   - **Public route**: `/live/[slug]` (or `/stream/[id]`) — Server Component loads session + passes playback to client `MuxPlayer`.

3. **Mux**  
   - **VOD path** (plugin-native): upload → asset → playback IDs.  
   - **Live path**: create Live Stream via Mux API → RTMP URL for OBS → **live playback ID** for `MuxPlayer` `playbackId` — likely **custom endpoint** or hook, not only plugin defaults.

4. **Realtime layer**  
   - Comments + hearts: small audience (≤50) — WebSocket or managed realtime channel keyed by `sessionId`.  
   - Avoid duplicating Payload `find` on every keystroke; use append-only messages with optional persistence collection `live-comments`.

## Data Flow

1. Admin creates `live-sessions` doc → backend ensures Mux live stream resource exists → stores IDs on doc.  
2. Broadcaster pushes RTMP to Mux ingest URL.  
3. Viewers load page → player subscribes to HLS/live stream → parallel connection to realtime room for comments/hearts.  
4. Viewer slot: on connect increment; on disconnect/timeout decrement; reject at 50.

## Suggested Build Order

1. Plugin + env + webhook smoke test  
2. Session collection + access control  
3. Mux Live integration slice (prove playback in browser)  
4. Admin UI for session lifecycle  
5. Public watch page + cap  
6. Comments + reactions
