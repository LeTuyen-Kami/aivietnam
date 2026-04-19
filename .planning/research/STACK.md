# Stack Research

**Domain:** GetStream Video livestream trên Next.js + Payload CMS (brownfield)
**Researched:** 2026-04-19
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-------------------|
| `@stream-io/node-sdk` | Align with current Stream docs | Server: upsert users, generate JWT, create/manage calls | Official server SDK; secrets stay off the client |
| `@stream-io/video-react-sdk` | Latest compatible with project React 19 | Broadcaster + viewer UI (`StreamVideo`, `StreamCall`, `LivestreamLayout`) | [Stream React Video docs](https://getstream.io/video/docs/react/) |
| Next.js App Router `route.ts` | 15.x (existing) | Token API, webhook (future) | Same deployment as Payload |

### Supporting

| Library | Purpose | Notes |
|---------|---------|-------|
| Existing Payload `users` | Map `user.id` → Stream `user_id` | Stable string IDs; avoid PII in Stream id if policy requires |

### Development

| Tool | Purpose |
|------|---------|
| Env: `STREAM_API_KEY`, `STREAM_SECRET` (names per team convention) | Never `NEXT_PUBLIC_` for secret |

## Installation (reference)

```bash
pnpm add @stream-io/video-react-sdk @stream-io/node-sdk
```

## Alternatives Considered

| Choice | Alternative | Note |
|--------|-------------|------|
| Stream Video | Mux Live, Cloudflare Stream | Stream chosen explicitly; fits real-time WebRTC livestream + UI kit |

## What NOT to Use

- Embedding API secret in client bundle or `NEXT_PUBLIC_*`
- Long-lived tokens in localStorage without rotation strategy
