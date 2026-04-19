# Requirements: AI Vietnam — GetStream livestream

**Defined:** 2026-04-19  
**Core Value:** Admin mở/quản lý phiên livestream ổn định; người xem xem được luồng qua trang công khai với token an toàn.

## v1 Requirements

### Stream foundation

- [x] **STRM-01**: Server có thể khởi tạo Stream server client (API key + secret từ env) và không expose secret ra client
- [x] **STRM-02**: API đã xác thực có thể cấp JWT user cho Stream (tokenProvider / one-shot token) với TTL hợp lý
- [x] **STRM-03**: User Payload được map ổn định sang Stream user id (documented strategy)

### Data & CMS

- [x] **CMS-01**: Collection hoặc cấu trúc Payload lưu phiên livestream (tối thiểu: `callId`, `callType`, tiêu đề, trạng thái, slug/route công khai)
- [x] **CMS-02**: Access control: chỉ admin (hoặc role tương đương) tạo/sửa phiên; đọc theo quy tắc đã chốt (authenticated, không draft cho member; không anonymous)

### Admin

- [x] **ADM-01**: Trong Payload Admin, operator xem được danh sách phiên và trạng thái (live / scheduled / ended hoặc tương đương)
- [x] **ADM-02**: Operator có thể mở liên kết tới trang xem / thông tin cần để vận hành (ít nhất copy URL hoặc mở tab)

### Frontend — broadcaster (admin-only)

- [x] **BRD-01**: Route hoặc luồng trên site cho phép **chỉ admin** tạo/bắt đầu phiên livestream (join với quyền publish)
- [x] **BRD-02**: Guard rõ ràng (middleware / server check role) — user thường không vào được

### Frontend — viewer

- [x] **VIEW-01**: Trang công khai cho phép người xem join call dạng `livestream` và hiển thị UI viewer (ví dụ `LivestreamLayout` hoặc tương đương)
- [x] **VIEW-02**: Trạng thái UX khi chưa live / đã kết thúc (không chỉ màn hình lỗi thô)

## v2 Requirements (deferred)

- **REC-01**: Ghi hình / playback VOD sau live
- **CHAT-01**: Tích hợp Stream Chat bên cạnh video
- **NONADMIN-01**: User không phải admin được phép tạo phiên (policy + moderation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first |
| Self-hosted media SFU | Dùng Stream Cloud |
| Tự host token signing không qua Stream SDK | Dùng SDK chuẩn |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STRM-01 | Phase 1 | Done |
| STRM-02 | Phase 1 | Done |
| STRM-03 | Phase 1 | Done |
| CMS-01 | Phase 2 | Done |
| CMS-02 | Phase 2 | Done |
| ADM-01 | Phase 3 | Complete |
| ADM-02 | Phase 3 | Complete |
| BRD-01 | Phase 4 | Complete |
| BRD-02 | Phase 4 | Complete |
| VIEW-01 | Phase 5 | Complete |
| VIEW-02 | Phase 5 | Complete |

**Coverage:**

- v1 requirements: 11 total  
- Mapped to phases: 11  
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*
