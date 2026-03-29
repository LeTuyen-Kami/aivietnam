/**
 * Chỉ thêm N ảnh vào collection `media` — không xóa/sửa posts, pages, categories, v.v.
 *
 * Usage: bun run seed:media
 * Requires ít nhất một user (admin) trong DB.
 *
 * Ảnh lấy từ Picsum (id cố định 1..50) — có thể đổi COUNT hoặc URL trong file nếu cần.
 */
import 'dotenv/config'
import type { File } from 'payload'
import { createLocalReq, getPayload } from 'payload'

import config from '../src/payload.config'

const COUNT = 50

async function fetchPicsumFile(picsumId: number): Promise<File> {
  const url = `https://picsum.photos/id/${picsumId}/1200/800`
  const res = await fetch(url, { redirect: 'follow' })

  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`)
  }

  const data = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'image/jpeg'

  return {
    name: `seed-media-${picsumId}-${Date.now()}.jpg`,
    data: Buffer.from(data),
    mimetype: contentType.includes('image') ? contentType : 'image/jpeg',
    size: data.byteLength,
  }
}

async function main() {
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
  const runLabel = new Date().toISOString().slice(0, 10)

  console.log(`Đang thêm ${COUNT} media (seed ngày ${runLabel})…`)

  for (let i = 1; i <= COUNT; i++) {
    const file = await fetchPicsumFile(i)

    await payload.create({
      collection: 'media',
      data: {
        alt: `Seed bulk ${i}/${COUNT} — Picsum #${i} (${runLabel})`,
      },
      file,
      req,
    })

    if (i % 10 === 0) {
      console.log(`  … ${i}/${COUNT}`)
    }
  }

  console.log(`Xong: đã tạo ${COUNT} file trong media.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('seed:media lỗi:', err)
  process.exit(1)
})
