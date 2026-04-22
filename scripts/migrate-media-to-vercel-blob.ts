import 'dotenv/config'

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import type { File } from 'payload'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import type { Media } from '../src/payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '..')
const mediaDir = path.join(projectRoot, 'public', 'media')
const defaultCheckpointPath = path.join(os.tmpdir(), 'aivietnam-media-to-blob-checkpoint.json')
const blobHostPattern = /\.blob\.vercel-storage\.com$/i

type Checkpoint = {
  completedAt?: string
  failures: Array<{ id: number; reason: string }>
  lastProcessedId: number
  processedCount: number
  skippedCount: number
  updatedCount: number
}

type CliOptions = {
  checkpoint: string
  dryRun: boolean
  force: boolean
  limit: number
  resetCheckpoint: boolean
}

function parseArgs(argv: string[]): CliOptions {
  let checkpoint = defaultCheckpointPath
  let dryRun = false
  let force = false
  let limit = 25
  let resetCheckpoint = false

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--force') {
      force = true
      continue
    }

    if (arg === '--reset-checkpoint') {
      resetCheckpoint = true
      continue
    }

    if (arg.startsWith('--limit=')) {
      limit = Number.parseInt(arg.slice('--limit='.length), 10)
      continue
    }

    if (arg.startsWith('--checkpoint=')) {
      checkpoint = path.resolve(projectRoot, arg.slice('--checkpoint='.length))
      continue
    }
  }

  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error('`--limit` phải là số nguyên dương.')
  }

  return {
    checkpoint,
    dryRun,
    force,
    limit,
    resetCheckpoint,
  }
}

function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false

  try {
    return blobHostPattern.test(new URL(url).hostname)
  } catch {
    return false
  }
}

async function loadCheckpoint(checkpointPath: string, resetCheckpoint: boolean): Promise<Checkpoint> {
  if (resetCheckpoint) {
    return {
      failures: [],
      lastProcessedId: 0,
      processedCount: 0,
      skippedCount: 0,
      updatedCount: 0,
    }
  }

  try {
    const raw = await fs.readFile(checkpointPath, 'utf8')
    return JSON.parse(raw) as Checkpoint
  } catch {
    return {
      failures: [],
      lastProcessedId: 0,
      processedCount: 0,
      skippedCount: 0,
      updatedCount: 0,
    }
  }
}

async function saveCheckpoint(checkpointPath: string, checkpoint: Checkpoint): Promise<void> {
  await fs.mkdir(path.dirname(checkpointPath), { recursive: true })
  await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2))
}

function toPayloadFile(doc: Media, data: Buffer): File {
  return {
    data,
    mimetype: doc.mimeType || 'application/octet-stream',
    name: doc.filename || `media-${doc.id}`,
    size: data.byteLength,
  }
}

function resolveLocalFilePath(doc: Media): string | null {
  if (!doc.filename) return null
  return path.join(mediaDir, doc.filename)
}

async function migrateOne(payload: Awaited<ReturnType<typeof getPayload>>, doc: Media): Promise<void> {
  const localFilePath = resolveLocalFilePath(doc)

  if (!localFilePath) {
    throw new Error('Document không có filename.')
  }

  const fileBuffer = await fs.readFile(localFilePath)

  await payload.update({
    collection: 'media',
    id: doc.id,
    data: {},
    file: toPayloadFile(doc, fileBuffer),
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Thiếu BLOB_READ_WRITE_TOKEN. Blob plugin sẽ không được bật.')
  }

  const payload = await getPayload({ config })
  const checkpoint = await loadCheckpoint(options.checkpoint, options.resetCheckpoint)

  console.log(
    [
      `Bắt đầu migrate media theo batch=${options.limit}`,
      `dryRun=${options.dryRun}`,
      `force=${options.force}`,
      `checkpoint=${options.checkpoint}`,
    ].join(' | '),
  )

  for (;;) {
    const { docs } = await payload.find({
      collection: 'media',
      depth: 0,
      limit: options.limit,
      overrideAccess: true,
      sort: 'id',
      where: {
        id: {
          greater_than: checkpoint.lastProcessedId,
        },
      },
    })

    if (!docs.length) {
      checkpoint.completedAt = new Date().toISOString()
      await saveCheckpoint(options.checkpoint, checkpoint)
      console.log('Không còn media nào phía sau checkpoint. Migration hoàn tất.')
      console.log(`Checkpoint: ${options.checkpoint}`)
      break
    }

    for (const doc of docs as Media[]) {
      checkpoint.lastProcessedId = doc.id
      checkpoint.processedCount += 1

      const localFilePath = resolveLocalFilePath(doc)

      if (!localFilePath) {
        checkpoint.skippedCount += 1
        checkpoint.failures.push({ id: doc.id, reason: 'missing filename' })
        console.warn(`#${doc.id} skip: thiếu filename`)
        await saveCheckpoint(options.checkpoint, checkpoint)
        continue
      }

      if (!options.force && isBlobUrl(doc.url)) {
        checkpoint.skippedCount += 1
        console.log(`#${doc.id} skip: đã là Blob URL`)
        await saveCheckpoint(options.checkpoint, checkpoint)
        continue
      }

      try {
        await fs.access(localFilePath)
      } catch {
        checkpoint.skippedCount += 1
        checkpoint.failures.push({ id: doc.id, reason: `missing local file: ${localFilePath}` })
        console.warn(`#${doc.id} skip: không tìm thấy file local ${localFilePath}`)
        await saveCheckpoint(options.checkpoint, checkpoint)
        continue
      }

      if (options.dryRun) {
        console.log(`#${doc.id} dry-run: ${doc.filename} -> Blob`)
        await saveCheckpoint(options.checkpoint, checkpoint)
        continue
      }

      try {
        await migrateOne(payload, doc)
        checkpoint.updatedCount += 1
        console.log(`#${doc.id} ok: ${doc.filename}`)
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error'
        checkpoint.failures.push({ id: doc.id, reason })
        console.error(`#${doc.id} failed: ${reason}`)
      }

      await saveCheckpoint(options.checkpoint, checkpoint)
    }
  }

  console.log(
    JSON.stringify(
      {
        checkpoint: options.checkpoint,
        failures: checkpoint.failures.length,
        lastProcessedId: checkpoint.lastProcessedId,
        processedCount: checkpoint.processedCount,
        skippedCount: checkpoint.skippedCount,
        updatedCount: checkpoint.updatedCount,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
