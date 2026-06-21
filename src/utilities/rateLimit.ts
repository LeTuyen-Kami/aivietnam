/**
 * Rate limiter in-memory, BEST-EFFORT (audit M-g).
 *
 * LƯU Ý QUAN TRỌNG: state nằm trong RAM của từng instance. Trên serverless
 * đa-instance (vd Vercel) đây chỉ là lớp giảm thiểu spam/đốt-quota cơ bản, KHÔNG
 * thay thế được store tập trung. Production nên chuyển sang Redis/Upstash.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10000

function prune(now: number): void {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key)
  }
}

/** Trả về true nếu được phép, false nếu vượt giới hạn trong cửa sổ thời gian. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    prune(now)
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

/** IP client tốt nhất có thể (header có thể bị giả; chỉ dùng cho rate-limit). */
export function clientIpFromHeaders(req: Request): string {
  const h = req.headers
  const cf = h.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (fwd) return fwd
  const real = h.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}
