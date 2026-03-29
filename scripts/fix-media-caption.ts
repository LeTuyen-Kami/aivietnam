/**
 * One-off script to fix media.caption column type migration issue.
 * Drops the caption column so Payload can recreate it as jsonb.
 * Run: node --import=tsx scripts/fix-media-caption.ts  (or: pnpm exec tsx scripts/fix-media-caption.ts)
 */
import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

async function fix() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query('ALTER TABLE "media" DROP COLUMN IF EXISTS "caption"')
    console.log('✓ Dropped media.caption column. Restart your app to let Payload recreate it.')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

fix()
