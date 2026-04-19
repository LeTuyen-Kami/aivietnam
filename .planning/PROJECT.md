# AI Vietnam — GetStream livestream

## What This Is

Nền tảng hiện tại là website Next.js 15 + Payload CMS 3 (PostgreSQL), đang được mở rộng để tích hợp **Stream Video** ([getstream.io](https://getstream.io/)) cho **livestream**: quản lý phiên trong **Payload Admin**, tạo phiên trên **site (frontend)** — giai đoạn đầu **chỉ admin** — và trang **xem live** cho người xem.

## Core Value

Admin có thể **mở và quản lý phiên livestream ổn định**, người xem **xem được luồng** qua trang công khai với token an toàn (phát sinh server-side).

## Requirements

### Validated

- ✓ Trang CMS, bài viết, khối nội dung, auth Google/site — existing (Payload + Next)
- ✓ API route handlers và Local API patterns — existing
- ✓ Bản đồ codebase trong `.planning/codebase/` — existing
- ✓ Phase 1 — Stream foundation: `@stream-io/node-sdk` + env, `POST /api/stream/token`, mapping `String(user.id)` (STRM-01–03), 2026-04-19
- ✓ Phase 2 — Payload session model: collection `livestreams` (CMS-01–02), access + migration + `generate:types`, 2026-04-19

### Active

- [ ] Stream Video client (`@stream-io/video-react-sdk`) và `NEXT_PUBLIC_STREAM_API_KEY` trên UI (Phase 4–5)
- [x] Token JWT user chỉ tạo trên server; không lộ API secret *(token route + server-only Stream client)*
- [x] Mô hình dữ liệu phiên livestream (Payload) — `livestreams` với `callId`, `callType`, slug, trạng thái; đọc không ẩn danh *(Phase 2)*
- [ ] Màn hình quản lý phiên trong Payload Admin (danh sách, trạng thái, liên kết xem/phát)
- [ ] Luồng tạo phiên trên frontend — **chỉ role admin** (route guard + access control)
- [ ] Trang xem livestream công khai (viewer) dùng pattern `livestream` call type + UI viewer

### Out of Scope (v1)

- Chat messaging Stream (sản phẩm Chat riêng) — tập trung Video/Livestream
- Multi-host phức tạp, VOD lưu trữ dài hạn — có thể sau
- App mobile native — web trước
- Người dùng không phải admin tự tạo phiên — **đã chốt: chỉ admin trong v1**

## Context

- **Brownfield:** Monorepo Next + Payload; đọc `.planning/codebase/ARCHITECTURE.md`, `STACK.md`, `INTEGRATIONS.md`.
- Stream Video: call type `livestream` cho broadcast; `StreamVideoClient` + `StreamCall` + `LivestreamLayout` phía React ([docs](https://getstream.io/video/docs/react/)).
- Server: `StreamClient` / `@stream-io/node-sdk` — `upsertUsers`, `generateUserToken`, tạo call qua API.

## Constraints

- **Security:** Secret Stream chỉ trên server; client nhận token ngắn hạn qua API đã xác thực.
- **Stack:** Giữ TypeScript, `bun` cho script theo convention repo khi phù hợp; dự án hiện dùng pnpm cho dependency chính.
- **Payload:** Thay schema phải chạy `generate:types`; nested operations trong hooks cần `req`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stream Video (không chỉ Chat) | Yêu cầu livestream + viewer | — Pending |
| Token chỉ server-side | Bắt buộc theo Stream | — Pending |
| Chỉ admin tạo phiên (v1) | Theo mô tả sản phẩm | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 — Phase 2 complete*
