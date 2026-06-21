import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
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

export const getLatestLeftPosts = cache(
  async (from: number, to: number, categoryIds: (number | string)[] = []): Promise<Post[]> => {
    const payload = await getPayload({ config: configPromise })
    const normalizedFrom = Math.max(1, Math.floor(from))
    const normalizedTo = Math.max(normalizedFrom, Math.floor(to))
    const normalizedCategoryIds = categoryIds.filter(
      (id, index, arr): id is number | string =>
        (typeof id === 'number' && Number.isFinite(id) && id > 0 && arr.indexOf(id) === index) ||
        (typeof id === 'string' && id.trim().length > 0 && arr.indexOf(id) === index),
    )

    const where: Where = {
      _status: {
        equals: 'published',
      },
      ...(normalizedCategoryIds.length > 0
        ? {
            categories: {
              in: normalizedCategoryIds,
            },
          }
        : {}),
    }

    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: normalizedTo,
      overrideAccess: false,
      pagination: false,
      sort: '-publishedAt',
      where,
    })

    const docs = result.docs as Post[]
    if (docs.length === 0) {
      return []
    }

    const startIndex = normalizedFrom - 1
    const endIndex = normalizedTo

    if (startIndex >= docs.length) {
      return []
    }

    return docs.slice(startIndex, endIndex)
  },
)
