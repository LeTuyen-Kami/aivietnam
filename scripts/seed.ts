/**
 * Run seed from command line.
 * Usage: bun run seed
 * Requires at least one user to exist in the database (create via admin first).
 */
import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'
import { seed } from '../src/endpoints/seed'
import config from '../src/payload.config'

async function runSeed() {
  const payload = await getPayload({ config })

  const { docs: users } = await payload.find({
    collection: 'users',
    limit: 1,
  })

  if (!users?.length) {
    console.error(
      'No users found. Please create an admin user first via /admin, then run this script.',
    )
    process.exit(1)
  }

  const user = users[0]
  console.log(`Running seed as user: ${user.email}`)

  const req = await createLocalReq({ user }, payload)
  await seed({ payload, req })

  console.log('Seed completed successfully!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
