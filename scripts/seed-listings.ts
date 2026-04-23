import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'

import config from '../src/payload.config'
import type { User } from '../src/payload-types'
import { seedListingCategories } from '../src/endpoints/seed/listings'

async function runSeedListings() {
  const payload = await getPayload({ config })

  const { docs: users } = await payload.find({
    collection: 'users',
    limit: 1,
  })

  if (!users.length) {
    console.error('No users found. Please create an admin user first via /admin, then run this script.')
    process.exit(1)
  }

  const user = users[0] as User
  const req = await createLocalReq({ user }, payload)

  await payload.db.deleteMany({
    collection: 'listing-categories',
    req,
    where: {},
  })

  if (payload.collections['listing-categories']?.config.versions) {
    await payload.db.deleteVersions({
      collection: 'listing-categories',
      req,
      where: {},
    })
  }
  await seedListingCategories({ payload, req })

  console.log('Listing categories seed completed successfully!')
  process.exit(0)
}

runSeedListings().catch((err) => {
  console.error('Listings seed failed:', err)
  process.exit(1)
})
