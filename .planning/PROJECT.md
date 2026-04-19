# AI Vietnam — Livestream (Mux) milestone

## What This Is

Mở rộng site Payload/Next.js hiện tại bằng tính năng **phát trực tiếp (livestream)**: quản trị viên tạo và quản lý **phiên live** từ trang riêng (chỉ admin), người xem vào **trang xem live** với giới hạn **tối đa 50 người xem đồng thời**, và trong phiên có **bình luận** cùng **tương tác kiểu thả tim** (reactions). Video pipeline dựa trên **Mux**, bắt đầu với plugin cộng đồng [`@oversightstudio/mux-video`](https://github.com/oversightstudio/payload-plugins/tree/main/packages/mux-video) trong Payload.

## Core Value

Người xem có thể **xem live ổn định** và **tương tác (comment + tim)** trong một phiên có giới hạn rõ ràng; admin có thể **tạo và kiểm soát phiên live** mà không cần luồng công cụ tách rời khỏi CMS.

## Requirements

### Validated

- ✓ CMS headless Payload 3 + Next.js App Router — existing (see `.planning/codebase/ARCHITECTURE.md`)
- ✓ PostgreSQL, REST/GraphQL Payload, custom route handlers — existing
- ✓ Mô hình comment/API tùy biến cho frontend (ví dụ `site-comments`) — existing pattern có thể mở rộng

### Active

- [ ] Tích hợp plugin Mux Video (`@oversightstudio/mux-video`) + biến môi trường Mux (token, webhook)
- [ ] Thiết kế **phiên live** (collection/global): metadata phiên, trạng thái, liên kết tới nguồn phát Mux (live playback / asset — xem Key Decisions)
- [ ] Trang **tạo/quản lý phiên live** — **chỉ admin** (access + route bảo vệ)
- [ ] Trang **xem live** công khai (hoặc theo rule bạn chọn ở phase discuss) với **player** phù hợp
- [ ] **Giới hạn 50 người xem đồng thời** (định nghĩa “viewer” và enforcement server-side trong plan)
- [ ] **Comment realtime hoặc gần realtime** trong phiên live
- [ ] **Thả tim / reactions** trong phiên live

### Out of Scope (v1 — có thể điều chỉnh khi discuss)

- Ứng dụng native iOS/Android riêng cho viewer
- Đa phòng live đồng thời phức tạp (nhiều host, nhiều layout) — trừ khi được nâng scope
- Monetization / vé / paywall — defer

## Context

- Repo: monolith Next.js + Payload (`src/payload.config.ts`, `src/collections/`, `src/app/(frontend)/`).
- Plugin `mux-video` tạo collection `mux-video`, webhook tại `/api/mux/webhook` (hoặc prefix API tùy `routes.api`). README plugin mô tả chủ yếu **upload & playback VOD**; **live broadcast** thường cần **Mux Live Streams** (RTMP → playback IDs) — có thể cần lớp tích hợp thêm ngoài plugin thuần VOD (chi tiết trong `.planning/research/`).
- Giới hạn 50 viewer: trên môi trường serverless cần store tập trung (ví dụ Redis/Upstash) hoặc dịch vụ realtime có slot — không dựa vào bộ đếm chỉ trong một instance.

## Constraints

- **Tech**: Giữ stack hiện tại (Payload 3, Next 15, TypeScript). Cài thêm dependency qua **bun** theo preference repo user (lockfile hiện có pnpm — align với team khi implement).
- **Security**: Local API `overrideAccess: false` khi truyền `user`; webhook Mux verify chữ ký.
- **Product**: Admin-only tạo phiên; viewer cap 50 là requirement cứng cho v1.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dùng `@oversightstudio/mux-video` làm nền Mux trong Payload | User chọn; có sẵn collection, webhook, xóa đồng bộ asset | — Pending |
| Nguồn “live” thật vs VOD giả live | Plugin README nhấn mạnh VOD; live thật cần xác nhận Mux Live API | — Pending — phase 1 research/PLAN |
| Realtime comments/reactions | Cần chọn transport (SSE, WS, hoặc BaaS realtime) phù hợp deploy | — Pending |

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
*Last updated: 2026-04-19 after GSD new-project initialization (livestream initiative)*
