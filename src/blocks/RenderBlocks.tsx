import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { AIEcosystemMapBlockComponent } from '@/blocks/AIEcosystemMap/Component'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { EnhancedMediaBlock } from '@/blocks/EnhancedMediaBlock/Component'
import { FeaturedPostsSideMediaBlockComponentAsync } from '@/blocks/FeaturedPostsSideMedia/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/Component'
import { HumanitiesCornerBlockComponent } from '@/blocks/HumanitiesCorner/Component'
import { ListingCreateBlockComponent } from '@/blocks/ListingCreate/Component'
import { ListingsCategoriesGridBlockComponent } from '@/blocks/ListingsCategoriesGrid/Component'
import { ListingsCategoryItemBlockComponent } from '@/blocks/ListingsCategoryItem/Component'
import { LivestreamPortalBlockComponent } from '@/blocks/LivestreamPortal/Component'
import { MarketplaceStatsBlockComponent } from '@/blocks/MarketplaceStats/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { MediaHubTriptychBlockComponent } from '@/blocks/MediaHubTriptych/Component'
import { NewsletterSignupBlock } from '@/blocks/NewsletterSignup/Component'
import { PortalSplitLayoutBlockAsync } from '@/blocks/PortalSplitLayout/Component'
import { YouTubeEmbedBlockComponent } from '@/blocks/YouTubeEmbed/Component'

const blockComponents = {
  archive: ArchiveBlock,
  aiEcosystemMap: AIEcosystemMapBlockComponent,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  featuredPostsSideMedia: FeaturedPostsSideMediaBlockComponentAsync,
  heroCarousel: HeroCarouselBlock,
  portalSplitLayout: PortalSplitLayoutBlockAsync,
  humanitiesCorner: HumanitiesCornerBlockComponent,
  mediaHubTriptych: MediaHubTriptychBlockComponent,
  newsletterSignup: NewsletterSignupBlock,
  mediaBlock: MediaBlock,
  enhancedMediaBlock: EnhancedMediaBlock,
  youtubeEmbed: YouTubeEmbedBlockComponent,
  listingCreate: ListingCreateBlockComponent,
  listingsCategoriesGrid: ListingsCategoriesGridBlockComponent,
  listingsCategoryItem: ListingsCategoryItemBlockComponent,
  marketplaceStats: MarketplaceStatsBlockComponent,
  livestreamPortal: LivestreamPortalBlockComponent,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="md:my-8 my-0 relative z-0" key={index}>
                  {/* @ts-expect-error block union props are resolved at runtime by blockType */}
                  <Block {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
