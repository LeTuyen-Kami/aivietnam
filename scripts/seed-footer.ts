/**
 * Chỉ ghi global `footer` (không xóa collection, không seed full).
 * Usage:
 *   bun run seed:footer
 *   bun run seed:footer -- 123        # ID media làm ảnh feature
 * Hoặc FOOTER_FEATURE_MEDIA_ID=123 bun run seed:footer
 *
 * Cần ít nhất một user trong DB (giống script seed chính).
 */
import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'
import { buildFooterData } from '../src/endpoints/seed/footer'
import config from '../src/payload.config'

function parseMediaIdFromArgs(): number | undefined {
  const dash = process.argv.indexOf('--')
  const raw = dash >= 0 ? process.argv[dash + 1] : process.argv[2]
  if (!raw || raw.startsWith('-')) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : undefined
}

async function resolveFeatureMediaId(payload: Awaited<ReturnType<typeof getPayload>>): Promise<number | null> {
  const fromEnv = process.env.FOOTER_FEATURE_MEDIA_ID?.trim()
  if (fromEnv) {
    const n = Number.parseInt(fromEnv, 10)
    if (Number.isFinite(n)) return n
  }

  const fromArg = parseMediaIdFromArgs()
  if (fromArg != null) return fromArg

  const { docs } = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    sort: '-createdAt',
  })
  const id = docs[0]?.id
  return typeof id === 'number' ? id : null
}

async function run() {
  const payload = await getPayload({ config })

  const { docs: users } = await payload.find({
    collection: 'users',
    limit: 1,
  })

  if (!users?.length) {
    console.error('Chưa có user. Tạo admin qua /admin rồi chạy lại.')
    process.exit(1)
  }

  const req = await createLocalReq({ user: users[0] }, payload)
  const mediaId = await resolveFeatureMediaId(payload)

  if (mediaId == null) {
    console.warn('Không có FOOTER_FEATURE_MEDIA_ID / tham số / media nào — bỏ qua featureImage.')
  }

  await payload.updateGlobal({
    slug: 'footer',
    data: buildFooterData(mediaId),
    req,
    context: { disableRevalidate: true },
  })

  console.log('Đã cập nhật global footer.', mediaId != null ? `(featureImage: media #${mediaId})` : '')
  process.exit(0)
}

run().catch((err) => {
  console.error('seed:footer thất bại:', err)
  process.exit(1)
})
