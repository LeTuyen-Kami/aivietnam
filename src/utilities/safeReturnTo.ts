/** Cookie httpOnly chứa nonce chống CSRF cho luồng OAuth (set ở start, verify ở callback). */
export const OAUTH_STATE_COOKIE = 'oauth_state_nonce'

/**
 * Validate `returnTo` cho luồng OAuth để chống open-redirect (audit HIGH-3).
 * Chỉ chấp nhận path nội bộ bắt đầu bằng một '/' đơn; chặn protocol-relative
 * (`//host`), backslash (`/\host` -> browser hiểu thành `//host`) và ký tự điều khiển.
 * Trả về '/' nếu không hợp lệ.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  if (value.includes('\\')) return '/'
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return '/'
  }
  return value
}
