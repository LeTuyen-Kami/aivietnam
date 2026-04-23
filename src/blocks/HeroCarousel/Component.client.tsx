'use client'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { cn } from '@/utilities/ui'
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { motion } from 'framer-motion'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import type { HeroCarouselBlock as HeroCarouselBlockProps } from '@/payload-types'

const slideImage = (
  media: NonNullable<HeroCarouselBlockProps['slides']>[number]['media'],
  className?: string,
) => (
  <Media
    className="absolute inset-0"
    fill
    imgClassName={cn('h-full w-full object-cover', className)}
    pictureClassName="absolute inset-0 block h-full w-full"
    priority
    resource={media}
  />
)

export const HeroCarouselClient = ({ autoplayDelay, slides }: HeroCarouselBlockProps) => {
  const slideItems = slides ?? []

  return (
    <section className="container">
      <div className="relative w-full aspect-video">
        <Swiper
          modules={[A11y, Autoplay, Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          loop={slideItems.length > 1}
          // autoplay={autoplayDelay && autoplayDelay > 0 ? { delay: autoplayDelay } : false}
          autoplay={false}
          className="[--swiper-navigation-color:white] [--swiper-pagination-color:white]"
        >
          {slideItems.map((slide, index) => {
            const media = slide.media

            if (typeof media !== 'object' || !media) {
              return null
            }

            const key = `${slide.id ?? 'slide'}-${index}`

            if (slide.type === 'ctaHero') {
              return (
                <SwiperSlide key={key}>
                  <div className="relative w-full aspect-video">
                    {slideImage(media, 'scale-100')}
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative z-10 flex w-full aspect-video items-center justify-center">
                      <motion.div
                        className="py-16 sm:py-20"
                        initial={{ rotateY: 45, opacity: 0 }}
                        whileInView={{ rotateY: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.45 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{ transformPerspective: 1000, transformOrigin: 'center' }}
                      >
                        <div className="text-white">
                          {slide.eyebrow ? (
                            <p className="mb-4 text-[32px] tracking-tight text-white/85 sm:text-2xl font-dancing">
                              {slide.eyebrow}
                            </p>
                          ) : null}
                          <h2 className="text-4xl font-semibold uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
                            {slide.title}
                          </h2>
                          {slide.description ? (
                            <p className="mt-4 max-w-3xl text-base text-white/80 sm:text-lg">
                              {slide.description}
                            </p>
                          ) : null}
                          {slide.links?.length ? (
                            <div className="mt-8 flex flex-wrap gap-3">
                              {slide.links.map(({ id, link }, linkIndex) => (
                                <CMSLink
                                  key={id ?? `${key}-link-${linkIndex}`}
                                  {...link}
                                  className="min-w-[180px] border-white bg-transparent! text-center text-sm uppercase rounded-none! tracking-wide text-white hover:bg-white! hover:text-black!"
                                  size="lg"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </SwiperSlide>
              )
            }

            const rawHref = typeof slide.href === 'string' ? slide.href.trim() : ''
            const inner = <div className="relative w-full aspect-video">{slideImage(media)}</div>

            return (
              <SwiperSlide key={key}>
                {rawHref ? (
                  <SmartLink className="block" href={rawHref}>
                    {inner}
                  </SmartLink>
                ) : (
                  inner
                )}
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </section>
  )
}
