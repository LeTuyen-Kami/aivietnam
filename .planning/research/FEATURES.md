# Features Research — Stream livestream on CMS site

**Researched:** 2026-04-19

## Table stakes (expected)

- **Server-minted tokens** — Viewer và broadcaster đều cần JWT từ backend
- **Call types** — `livestream` cho một-nhiều broadcast ([watching a livestream](https://getstream.io/video/docs/react/ui-cookbook/watching-a-livestream))
- **Join semantics** — Host: `call.join({ create: true })`; viewer: `call.join()` sau khi có quyền
- **Admin operational visibility** — Danh sách phiên, trạng thái (live/ended), link xem

## Differentiators (optional later)

- Recording, RTMP ingress, simulcast
- Moderation dashboard (Stream Moderation product — separate)

## Anti-features / defer

- Public “anyone goes live” without review — explicitly out for v1 (admin-only create)

## Complexity notes

| Area | Complexity |
|------|------------|
| Token API + auth | Medium |
| Payload collection for sessions | Low–medium |
| Payload Admin custom UI | Medium |
| Viewer page + layout | Medium (SDK handles most UI) |
