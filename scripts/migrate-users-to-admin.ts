/**
 * One-time: set roles to ['admin'] for users that have no roles (e.g. after adding the roles field).
 * Run: bun run scripts/migrate-users-to-admin.ts
 */
import { getPayload } from 'payload'

import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'users',
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })

  for (const doc of docs) {
    const u = doc as { id: number; roles?: string[] | null }
    if (!u.roles?.length) {
      await payload.update({
        collection: 'users',
        id: u.id,
        data: { roles: ['admin'] },
        overrideAccess: true,
      })
      console.log('Updated user', u.id, '→ admin')
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
