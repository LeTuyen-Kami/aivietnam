const SAFE_SCHEME = /^(https?|mailto|tel):/i

/**
 * Loại ký tự điều khiển (<= 0x1F và 0x7F) mà trình duyệt bỏ qua khi phân tích URL
 * (vd "java\tscript:" -> "javascript:"). Dùng char-code để source không chứa byte
 * điều khiển. Cũng strip khoảng trắng đầu/cuối.
 */
function stripControlChars(value: string): string {
  let out = ''
  for (const ch of value) {
    const code = ch.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) continue
    out += ch
  }
  return out.trim()
}

/**
 * Chuẩn hoá href trước khi render vào <a>/<Link> để chống XSS & open-redirect (audit M2).
 * - Strip ký tự điều khiển để không bypass được scheme check.
 * - Chặn protocol-relative (`//host`) và backslash (`/\host`, `\host`) — open-redirect.
 * - Có scheme: chỉ chấp nhận http/https/mailto/tel. Không scheme: path/anchor/query, an toàn.
 * Trả về undefined nếu không an toàn (link sẽ không render / không bấm được).
 */
export function sanitizeHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined

  const cleaned = stripControlChars(href)
  if (!cleaned) return undefined

  // Protocol-relative hoặc backslash -> chặn (open-redirect / scheme trá hình).
  if (cleaned.startsWith('//') || cleaned.startsWith('/\\') || cleaned.startsWith('\\')) {
    return undefined
  }

  const schemeMatch = cleaned.match(/^[a-z][a-z0-9+.-]*:/i)
  if (schemeMatch) {
    return SAFE_SCHEME.test(cleaned) ? cleaned : undefined
  }

  // Không có scheme -> path tương đối / anchor / query, an toàn.
  return cleaned
}
