# Stack Research

**Domain:** Live video + CMS (Payload) + realtime engagement  
**Researched:** 2026-04-19  
**Confidence:** MEDIUM (plugin README is VOD-focused; live path needs confirmation in implementation)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-------------------|
| Payload CMS | 3.x (repo) | Sessions, access, admin | Already in monolith |
| `@oversightstudio/mux-video` | Latest compatible with Payload 3 | Collection `mux-video`, uploads, webhooks | User-selected; reduces admin wiring for Mux assets |
| `@mux/mux-player-react` | Per plugin README | Playback in Next.js | Official player for playback IDs / HLS |
| Mux Video / Live APIs | Cloud | Encode, CDN, live stream endpoints | Industry standard for low-latency live at small scale |

### Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| Upstash Redis / Vercel KV | Atomic viewer counter + rate limits | Enforce “50 concurrent” across serverless instances |
| Partykit / Ably / Pusher / Supabase Realtime | Fan-out comments & reactions | Pick one in plan-phase after latency/cost constraints |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `payload generate:types` | Types after schema changes | Required after new collections |
| `payload generate:importmap` | Admin component paths | If custom field UI for live session |

## Installation

- Add `@oversightstudio/mux-video` and `@mux/mux-player-react` with project package manager.  
- Configure env: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SERVER_URL` (cors_origin per README).

## What NOT to Use (for v1)

- **Custom FFmpeg pipeline** — unnecessary versus Mux-managed ingest.  
- **In-memory only viewer count** — breaks on multi-instance / cold starts.
