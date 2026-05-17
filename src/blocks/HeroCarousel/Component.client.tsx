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

const swiperShellClassName = cn(
  'absolute inset-0 h-full w-full',
  '[--swiper-navigation-color:white] [--swiper-pagination-color:white]',
  '[&_.swiper-button-next]:max-md:hidden [&_.swiper-button-prev]:max-md:hidden',
  'max-md:[&_.swiper-pagination]:!bottom-3 max-md:[&_.swiper-pagination]:flex max-md:[&_.swiper-pagination]:justify-center',
  'max-md:[&_.swiper-pagination-bullet]:mx-1 max-md:[&_.swiper-pagination-bullet]:h-2 max-md:[&_.swiper-pagination-bullet]:w-2 max-md:[&_.swiper-pagination-bullet]:rounded-full',
  'max-md:[&_.swiper-pagination-bullet]:border max-md:[&_.swiper-pagination-bullet]:border-white max-md:[&_.swiper-pagination-bullet]:bg-transparent max-md:[&_.swiper-pagination-bullet]:opacity-100',
  'max-md:[&_.swiper-pagination-bullet-active]:!border-white max-md:[&_.swiper-pagination-bullet-active]:!bg-white',
)

export const HeroCarouselClient = ({ autoplayDelay, slides }: HeroCarouselBlockProps) => {
  const slideItems = slides ?? []

  return (
    <section className="container">
      <div className="relative w-full aspect-360/500 md:aspect-video px-4 md:px-0">
        <Swiper
          modules={[A11y, Autoplay, Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          loop={slideItems.length > 1}
          // autoplay={autoplayDelay && autoplayDelay > 0 ? { delay: autoplayDelay } : false}
          autoplay={false}
          className={swiperShellClassName}
        >
          {slideItems.map((slide, index) => {
            const media = slide.media

            if (typeof media !== 'object' || !media) {
              return null
            }

            const key = `${slide.id ?? 'slide'}-${index}`

            if (slide.type === 'ctaHero') {
              return (
                <SwiperSlide key={key} className="h-auto!">
                  <div className="relative w-full aspect-360/500 md:aspect-video">
                    {slideImage(media, 'scale-100')}
                    <div className="absolute inset-0 bg-black/55 max-md:bg-linear-to-b max-md:from-cyan-500/10 max-md:via-black/50 max-md:to-black/70" />
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.35] md:hidden"
                      style={{
                        backgroundImage:
                          'radial-gradient(ellipse 80% 50% at 50% 35%, rgba(34,211,238,0.12), transparent 55%), linear-gradient(105deg, transparent 40%, rgba(59,130,246,0.08) 48%, transparent 56%)',
                      }}
                    />
                    <div className="relative z-10 flex h-full min-h-0 w-full flex-col md:absolute md:inset-0 md:aspect-video md:items-center md:justify-center">
                      <motion.div
                        className="flex min-h-0 w-full flex-1 flex-col items-center px-4 pb-14 pt-11 text-white md:flex-none md:px-0 md:pb-0 md:pt-0 md:py-16 lg:py-20"
                        initial={{ rotateY: 45, opacity: 0 }}
                        whileInView={{ rotateY: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.45 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{ transformPerspective: 1000, transformOrigin: 'center' }}
                      >
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center md:w-full md:max-w-5xl md:flex-none md:items-center md:justify-center md:text-center">
                          {slide.eyebrow ? (
                            <p className="mb-3 max-md:text-2xl max-md:leading-snug md:mb-4 md:text-2xl md:tracking-tight md:text-white/85 font-dancing">
                              {slide.eyebrow}
                            </p>
                          ) : null}
                          <h2 className="max-md:max-w-[16rem] max-md:font-serif max-md:text-[1.65rem] max-md:font-bold max-md:uppercase max-md:leading-[1.12] max-md:tracking-tight md:text-6xl md:font-semibold md:uppercase md:tracking-tight md:text-white lg:text-7xl">
                            {slide.title}
                          </h2>
                          {slide.description ? (
                            <p className="mt-3 max-w-3xl max-md:font-serif max-md:text-[0.8125rem] max-md:font-bold max-md:uppercase max-md:leading-snug max-md:tracking-wide max-md:text-white md:mt-4 md:text-base md:normal-case md:font-normal md:tracking-normal md:text-white/80 lg:text-lg">
                              {slide.description}
                            </p>
                          ) : null}
                          {slide.links?.length ? (
                            <div className="mt-7 flex w-full max-w-70 flex-col items-stretch gap-3 md:mt-8 md:max-w-none md:flex-row md:flex-wrap md:justify-center">
                              {slide.links.map(({ id, link }, linkIndex) => (
                                <CMSLink
                                  key={id ?? `${key}-link-${linkIndex}`}
                                  {...link}
                                  className={cn(
                                    'min-w-[180px] border-white bg-transparent! text-center text-sm uppercase rounded-none! tracking-wide text-white hover:bg-white! hover:text-black!',
                                    'max-md:w-full max-md:min-w-0 max-md:border max-md:bg-black! max-md:px-3 max-md:py-2.5 max-md:text-[11px] max-md:leading-tight',
                                  )}
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
            const inner = (
              <div className="relative w-full aspect-360/500 md:aspect-video">
                {slideImage(media)}
              </div>
            )

            return (
              <SwiperSlide key={key} className="h-auto!">
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
