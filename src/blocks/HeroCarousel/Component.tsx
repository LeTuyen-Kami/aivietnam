import type { HeroCarouselBlock as HeroCarouselBlockProps } from '@/payload-types'

import { HeroCarouselClient } from './Component.client'

export const HeroCarouselBlock = (props: HeroCarouselBlockProps) => {
  if (!props.slides?.length) {
    return null
  }

  return <HeroCarouselClient {...props} />
}
