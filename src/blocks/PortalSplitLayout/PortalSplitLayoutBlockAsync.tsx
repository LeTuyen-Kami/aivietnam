import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { PortalSplitLayoutBlock, Post } from '@/payload-types'

import { PortalSplitLayoutBody } from './PortalSplitLayoutBody'
import { getLatestLeftPosts, resolvePost, resolvePosts } from './resolve-posts'
import type { ResolvedSection } from './types'

export const PortalSplitLayoutBlockAsync = async (
  props: PortalSplitLayoutBlock & { disableInnerContainer?: boolean },
) => {
  const { disableInnerContainer: _omitInnerContainer, ...block } = props
  const payload = await getPayload({ config: configPromise })

  let leftPostsResolved: Post[] = []

  if (block.leftSource === 'latest') {
    const legacyLimit = block.leftLatestLimit ?? 8
    const from = Math.max(1, Math.floor(block.leftLatestFrom ?? 1))
    const to = Math.max(from, Math.floor(block.leftLatestTo ?? legacyLimit))
    const leftCategoryFilterIds = (block.leftCategoryFilters ?? [])
      .map((category) =>
        typeof category === 'object' && category !== null ? category.id : category,
      )
      .filter((id): id is number => Number.isFinite(id) && id > 0)

    leftPostsResolved = await getLatestLeftPosts(from, to, leftCategoryFilterIds)
  } else {
    leftPostsResolved = await resolvePosts(payload, block.leftPosts ?? [])
  }

  const standardSectionsResolved: ResolvedSection[] = []

  for (const section of block.standardSections ?? []) {
    const featuredPost = await resolvePost(payload, section.featuredPost)
    const subPosts = await resolvePosts(payload, section.subPosts ?? [])
    const footerPosts = await resolvePosts(payload, section.footerPosts ?? [])

    standardSectionsResolved.push({
      accent: section.accent,
      featuredPost,
      footerPosts,
      id: section.id,
      sectionTitle: section.sectionTitle,
      subPosts,
    })
  }

  return (
    <PortalSplitLayoutBody
      {...block}
      leftPostsResolved={leftPostsResolved}
      standardSectionsResolved={standardSectionsResolved}
    />
  )
}
