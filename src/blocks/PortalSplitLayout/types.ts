import type { PortalSplitLayoutBlock, Post } from '@/payload-types'

export type AccentKey = NonNullable<PortalSplitLayoutBlock['row1LeftAccent']>

export type StandardSectionRow = NonNullable<
  NonNullable<PortalSplitLayoutBlock['standardSections']>[number]
>

export type SectionAccent = StandardSectionRow['accent']

export type ResolvedSection = {
  accent: SectionAccent
  featuredPost: Post | null
  footerPosts: Post[]
  id?: string | null
  sectionTitle: string
  subPosts: Post[]
}
