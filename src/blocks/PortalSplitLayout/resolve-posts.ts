import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import { cache } from 'react'

import type { Post } from '@/payload-types'

function isPostDoc(value: unknown): value is Post {
  return typeof value === 'object' && value !== null && 'title' in value && 'slug' in value
}

export async function resolvePost(
  payload: Payload,
  ref: number | Post | null | undefined,
): Promise<Post | null> {
  if (ref == null) {
    return null
  }

  if (isPostDoc(ref)) {
    return ref
  }

  try {
    const doc = await payload.findByID({
      collection: 'posts',
      id: ref,
      depth: 1,
      overrideAccess: false,
    })

    return doc as Post
  } catch {
    return null
  }
}

export async function resolvePosts(
  payload: Payload,
  refs: (number | Post)[] | null | undefined,
): Promise<Post[]> {
  if (!Array.isArray(refs)) {
    return []
  }

  const out: Post[] = []

  for (const ref of refs) {
    const post = await resolvePost(payload, ref)

    if (post) {
      out.push(post)
    }
  }

  return out
}

export const getLatestLeftPosts = cache(async (from: number, to: number): Promise<Post[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: to,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return (result.docs as Post[]).slice(from - 1, to)
})
