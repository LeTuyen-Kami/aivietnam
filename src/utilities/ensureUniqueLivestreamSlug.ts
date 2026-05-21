import type { Payload } from 'payload'

import { slugifyTitle } from '@/utilities/slugify'

type EnsureUniqueLivestreamSlugArgs = {
  payload: Payload
  baseSlug: string
  maxAttempts?: number
}

/**
 * Resolves a unique livestream slug from a base value.
 * Appends `-2`, `-3`, … when the base slug is already taken.
 */
export async function ensureUniqueLivestreamSlug({
  payload,
  baseSlug,
  maxAttempts = 100,
}: EnsureUniqueLivestreamSlugArgs): Promise<string> {
  const base = slugifyTitle(baseSlug)
  if (!base) {
    throw new Error('Invalid slug base')
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`

    const existing = await payload.find({
      collection: 'livestreams',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: candidate,
        },
      },
    })

    if (existing.docs.length === 0) {
      return candidate
    }
  }

  return `${base}-${Date.now().toString(36).slice(-6)}`
}
