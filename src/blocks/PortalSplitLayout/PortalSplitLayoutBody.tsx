import React from 'react'

import type { PortalSplitLayoutBlock, Post } from '@/payload-types'

import { HumanitarianArticlesList } from './HumanitarianArticlesList'
import { HumanitarianCornerPanel } from './HumanitarianCornerPanel'
import { LeftFeed } from './LeftFeed'
import { PortalMobileAdSlot } from './PortalMobileAdSlot'
import { RowOneLeft } from './RowOneLeft'
import { RowOneRight } from './RowOneRight'
import { StandardSection } from './StandardSection'
import type { ResolvedSection } from './types'

export const PortalSplitLayoutBody: React.FC<
  PortalSplitLayoutBlock & {
    humanitarianPostsResolved: Post[]
    leftPostsResolved: Post[]
    standardSectionsResolved: ResolvedSection[]
  }
> = (props) => {
  const {
    humanitarianItems,
    humanitarianPostsResolved,
    leftPostsResolved,
    row1CenterGraphic,
    row1GridItems,
    row1LeftAccent,
    row1LeftAccentCustomHex,
    row1LeftTitle,
    row1LeftTitleHref,
    row1OrbitRadiusMaxPct,
    row1OrbitRadiusMinPct,
    row1RightAccent,
    row1RightAccentCustomHex,
    row1RightCards,
    row1RightTitle,
    row1RightTitleHref,
    row1TagItems,
    standardSectionsResolved,
    mobileAdCss,
    mobileAdHtml,
    mobileAdScript,
  } = props

  const hasRow1 =
    row1LeftTitle ||
    row1RightTitle ||
    (typeof row1CenterGraphic === 'object' && row1CenterGraphic) ||
    (row1TagItems && row1TagItems.length > 0) ||
    (row1GridItems && row1GridItems.length > 0) ||
    (row1RightCards && row1RightCards.length > 0)

  return (
    <section className="container">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 gap-4 lg:gap-x-6 gap-x-5 divide-x divide-border/60">
        <aside className="lg:col-span-4 pr-0 lg:pr-6">
          <LeftFeed posts={leftPostsResolved} />
        </aside>

        <HumanitarianCornerPanel items={humanitarianItems} />
        <HumanitarianArticlesList posts={humanitarianPostsResolved} />

        <PortalMobileAdSlot css={mobileAdCss} html={mobileAdHtml} script={mobileAdScript} />

        <div className="space-y-12 lg:col-span-8">
          {hasRow1 && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8">
              <RowOneLeft
                row1CenterGraphic={row1CenterGraphic}
                row1GridItems={row1GridItems}
                row1LeftAccent={row1LeftAccent}
                row1LeftAccentCustomHex={row1LeftAccentCustomHex}
                row1LeftTitle={row1LeftTitle}
                row1LeftTitleHref={row1LeftTitleHref}
                row1OrbitRadiusMaxPct={row1OrbitRadiusMaxPct}
                row1OrbitRadiusMinPct={row1OrbitRadiusMinPct}
                row1TagItems={row1TagItems}
              />
              <RowOneRight
                row1RightAccent={row1RightAccent}
                row1RightAccentCustomHex={row1RightAccentCustomHex}
                row1RightCards={row1RightCards}
                row1RightTitle={row1RightTitle}
                row1RightTitleHref={row1RightTitleHref}
              />
            </div>
          )}

          {standardSectionsResolved.map((section, index) => (
            <StandardSection
              accent={section.accent}
              accentCustomHex={section.accentCustomHex}
              featuredPost={section.featuredPost}
              footerPosts={section.footerPosts}
              key={section.id ?? `${section.sectionTitle}-${index}`}
              sectionTitle={section.sectionTitle}
              sectionTitleHref={section.sectionTitleHref}
              subPosts={section.subPosts}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
