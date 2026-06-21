/**
 * Seeding qua HTTP đã bị VÔ HIỆU HOÁ hoàn toàn (audit C1).
 *
 * Trước đây route này chỉ kiểm `if (!user)`, nghĩa là bất kỳ tài khoản đăng nhập
 * nào (kể cả member tự đăng ký qua Google) đều có thể XOÁ SẠCH toàn bộ nội dung.
 * Việc seed giờ chỉ chạy qua CLI (`pnpm seed`, ...) bởi developer có quyền DB trực tiếp.
 */
export function POST(): Response {
  return new Response('Seeding via HTTP is disabled.', { status: 403 })
}
