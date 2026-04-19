# Roadmap: AI Vietnam — GetStream livestream

## Overview

Tích hợp Stream Video vào codebase Next.js + Payload hiện có: nền tảng bảo mật token và mapping user (Phase 1), mô hình dữ liệu phiên trong Payload (Phase 2), vận hành trong Admin (Phase 3), luồng phát dành cho admin (Phase 4), trang xem công khai (Phase 5).

## Phases

- [x] **Phase 1: Stream foundation** — Env, server SDK, token API, user mapping *(2026-04-19)*
- [x] **Phase 2: Payload session model** — Collection, access, generated types *(2026-04-19)*
- [x] **Phase 3: Admin session management** — Danh sách, trạng thái, liên kết vận hành trong Payload Admin (completed 2026-04-19)
- [x] **Phase 4: Broadcaster (admin-only)** — Trang/site tạo và bắt đầu livestream, guard role *(completed 2026-04-19)*
- [ ] **Phase 5: Public viewer** — Trang xem livestream, trạng thái UX đầy đủ

## Phase Details

### Phase 1: Stream foundation

**Goal:** Server có thể xác thực an toàn với Stream và cấp token cho user đã đăng nhập.

**Depends on:** Nothing (first phase)

**Requirements:** STRM-01, STRM-02, STRM-03

**Success Criteria** (what must be TRUE):

1. Biến môi trường cho Stream được đọc chỉ trên server; không có secret trong bundle client
2. Một route API (hoặc tương đương) trả JWT hợp lệ cho user đã xác thực Payload
3. Chiến lược map `user.id` → Stream user được ghi trong code hoặc tài liệu ngắn

**UI hint**: no

**Plans:** 2 / 2 complete

Plans:

- [x] 01-01: Cài dependency server/client SDK, env template
- [x] 01-02: Service + API token + upsert user Stream

---

### Phase 2: Payload session model

**Goal:** Lưu trữ phiên livestream trong CMS với access đúng role.

**Depends on:** Phase 1

**Requirements:** CMS-01, CMS-02

**Success Criteria** (what must be TRUE):

1. Document phiên chứa id/cấu hình cần để join Stream (`callId`, `callType`, v.v.)
2. Chỉ admin tạo/sửa; quyền đọc công khai phù hợp với trang viewer

**UI hint**: no

**Plans:** 2 / 2 complete

Plans:

- [x] 02-01: Định nghĩa collection + fields + indexes
- [x] 02-02: Access + hooks + `generate:types`

---

### Phase 3: Admin session management

**Goal:** Operator quản lý phiên trong Payload Admin.

**Depends on:** Phase 2

**Requirements:** ADM-01, ADM-02

**Success Criteria** (what must be TRUE):

1. List view hiển thị các phiên và trạng thái có thể quét nhanh
2. Có cách lấy URL xem hoặc thông tin vận hành từ document

**UI hint**: yes

**Plans:** 1/1 plans complete

Plans:

- [x] 03-01: defaultColumns, preview links, optional custom components

---

### Phase 4: Broadcaster (admin-only)

**Goal:** Admin tạo/bắt đầu phiên từ frontend site.

**Depends on:** Phase 2 (Phase 3 optional but recommended for ops)

**Requirements:** BRD-01, BRD-02

**Success Criteria** (what must be TRUE):

1. User không phải admin không thể gọi thành công API tạo/join publish
2. Admin có thể tạo/join call `livestream` và trạng thái được ghi vào Payload

**UI hint**: yes

**Plans:** 2 / 2 complete

Plans:

- [x] 04-01-PLAN.md — Admin guard/middleware, broadcaster token + start/end orchestration, blocking payload migrate
- [x] 04-02-PLAN.md — Broadcaster route/UI integration, tokenProvider lifecycle, admin deep-link utility/component

---

### Phase 5: Public viewer

**Goal:** Người xem mở URL công khai và xem livestream.

**Depends on:** Phase 1, Phase 2

**Requirements:** VIEW-01, VIEW-02

**Success Criteria** (what must be TRUE):

1. Viewer join được call (read-only) với token từ API
2. Trước/sau live có thông báo hoặc placeholder rõ ràng

**UI hint**: yes

**Plans:** TBD

Plans:

- [ ] 05-01: Dynamic route `/live/[slug]` (hoặc path đã chốn)
- [ ] 05-02: `LivestreamLayout` + loading/ended states

---

## Requirement Coverage Matrix

| Phase | Requirements |
|-------|----------------|
| 1 | STRM-01, STRM-02, STRM-03 |
| 2 | CMS-01, CMS-02 |
| 3 | ADM-01, ADM-02 |
| 4 | BRD-01, BRD-02 |
| 5 | VIEW-01, VIEW-02 |

---
*Roadmap created: 2026-04-19*
