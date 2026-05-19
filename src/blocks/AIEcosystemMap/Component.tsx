import React from 'react'

import type { AIEcosystemMapBlock, Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { cn } from '@/utilities/ui'

type Props = AIEcosystemMapBlock & {
  disableInnerContainer?: boolean
}

type CardKey =
  | 'forumCard'
  | 'studyGroupCard'
  | 'policyCard'
  | 'openSourceCard'
  | 'datasetCard'
  | 'libraryCard'
  | 'toolsCard'
  | 'allianceCard'
  | 'mindsetCard'
  | 'jobsCard'
  | 'reportsCard'
  | 'eventsCard'
  | 'startupCard'
  | 'cooperationCard'
  | 'communityProjectsCard'

type LabelKey =
  | 'centerTopLeftLabel'
  | 'centerTopMiddleLabel'
  | 'centerTopRightLabel'
  | 'centerMiddleLeftLabel'
  | 'centerMiddleRightLabel'
  | 'centerRightUpperLabel'
  | 'centerBottomLeftLabel'
  | 'centerBottomMiddleLabel'
  | 'centerBottomRightLabel'
  | 'centerBottomFarLeftLabel'
  | 'centerBottomFarRightLabel'

type ResolvedLabel = {
  text: string
  href: string
}

type CenterLabelValue =
  | string
  | {
      text?: string | null
      href?: string | null
    }
  | null
  | undefined

type CenterLabelHrefFieldKey =
  | 'centerTopLeftLabelHref'
  | 'centerTopMiddleLabelHref'
  | 'centerTopRightLabelHref'
  | 'centerMiddleLeftLabelHref'
  | 'centerMiddleRightLabelHref'
  | 'centerRightUpperLabelHref'
  | 'centerBottomLeftLabelHref'
  | 'centerBottomMiddleLabelHref'
  | 'centerBottomRightLabelHref'
  | 'centerBottomFarLeftLabelHref'
  | 'centerBottomFarRightLabelHref'

type CenterLabelRestFields = Partial<Record<LabelKey | CenterLabelHrefFieldKey, unknown>>

type ResolvedCard = {
  key: CardKey
  title: string
  href: string
  image: MediaType
}

type DesktopCardPlacement = {
  key: CardKey
}

type DesktopLabelPlacement = {
  key: LabelKey
}

const desktopCardPlacements: DesktopCardPlacement[] = [
  { key: 'jobsCard' },
  { key: 'reportsCard' },
  { key: 'eventsCard' },
  { key: 'startupCard' },
  { key: 'cooperationCard' },
  { key: 'communityProjectsCard' },
  { key: 'forumCard' },
  { key: 'studyGroupCard' },
  { key: 'policyCard' },
  { key: 'openSourceCard' },
  { key: 'datasetCard' },
  { key: 'libraryCard' },
  { key: 'toolsCard' },
  { key: 'allianceCard' },
  { key: 'mindsetCard' },
]

const desktopLabelPlacements: DesktopLabelPlacement[] = [
  { key: 'centerTopLeftLabel' },
  { key: 'centerTopMiddleLabel' },
  { key: 'centerTopRightLabel' },
  { key: 'centerMiddleLeftLabel' },
  { key: 'centerMiddleRightLabel' },
  { key: 'centerRightUpperLabel' },
  { key: 'centerBottomLeftLabel' },
  { key: 'centerBottomMiddleLabel' },
  { key: 'centerBottomRightLabel' },
  { key: 'centerBottomFarLeftLabel' },
  { key: 'centerBottomFarRightLabel' },
]

function resolveCard(
  card: AIEcosystemMapBlock[CardKey] | null | undefined,
  key: CardKey,
): ResolvedCard | null {
  if (!card) return null

  const title = typeof card.title === 'string' ? card.title.trim() : ''
  const href = typeof card.href === 'string' ? card.href.trim() : ''
  const image = typeof card.image === 'object' && card.image ? card.image : null

  if (!title || !image) return null

  return { key, title, href, image }
}

function resolveLabel(
  labelValue: CenterLabelValue,
  hrefValue?: string | null | undefined,
): ResolvedLabel | null {
  const text =
    typeof labelValue === 'string'
      ? labelValue.trim()
      : typeof labelValue?.text === 'string'
        ? labelValue.text.trim()
        : ''

  const hrefFromLabel =
    typeof labelValue === 'object' && labelValue && typeof labelValue.href === 'string'
      ? labelValue.href.trim()
      : ''

  const href = typeof hrefValue === 'string' ? hrefValue.trim() : hrefFromLabel

  if (!text) return null

  return { text, href }
}

function OrbitCard({
  card,
  className,
  style,
  stackLayout,
}: {
  card: ResolvedCard
  className?: string
  style?: React.CSSProperties
  /** Smaller orbit tiles on narrow phones; desktop orbit unchanged (lg:) */
  stackLayout?: boolean
}) {
  const imageNode = (
    <div
      className={cn(
        'relative mx-auto mb-2 overflow-hidden rounded-full bg-muted shadow-sm sm:mb-3',
        stackLayout ? 'size-14 max-[380px]:size-12 sm:size-18' : 'h-18 w-18 sm:size-20 lg:size-16',
      )}
    >
      <Media
        className="absolute inset-0"
        fill
        imgClassName="h-full w-full object-cover"
        resource={card.image}
        size="96px"
      />
    </div>
  )

  const content = (
    <>
      {imageNode}
      <h3
        className={cn(
          'text-center font-medium leading-tight text-foreground',
          stackLayout
            ? 'text-sm max-[380px]:text-sm sm:text-sm'
            : 'text-[15px] sm:text-base lg:text-[17px]',
        )}
      >
        {card.title}
      </h3>
    </>
  )

  return (
    <div className={className} style={style}>
      {card.href ? (
        <SmartLink
          className="group block transition-transform duration-200 ease-out hover:-translate-y-0.5"
          href={card.href}
        >
          {content}
        </SmartLink>
      ) : (
        <div>{content}</div>
      )}
    </div>
  )
}

function CenterLabel({ label }: { label: ResolvedLabel }) {
  const content = label.text

  if (label.href) {
    return (
      <SmartLink className="block wrap-break-word" href={label.href}>
        {content}
      </SmartLink>
    )
  }

  return <>{content}</>
}

function asCenterLabelValue(value: unknown): CenterLabelValue {
  return value as CenterLabelValue
}

function asCenterLabelHrefValue(value: unknown): string | null | undefined {
  return value as string | null | undefined
}

function CenterImage({
  image,
  href,
  variant = 'orbit',
}: {
  image: MediaType
  href?: string | null
  /** `stack` = mobile-only layout branch; `orbit` = desktop ring (unchanged at lg+) */
  variant?: 'orbit' | 'stack'
}) {
  const frameClass =
    variant === 'stack'
      ? 'relative mx-auto aspect-square w-[8.5rem] max-w-full shrink-0 overflow-hidden rounded-full bg-muted max-[380px]:w-[7.25rem] sm:w-44'
      : 'relative mx-auto aspect-square w-44 shrink-0 overflow-hidden rounded-full bg-muted sm:w-52 lg:w-[220px]'

  const media = (
    <div className={frameClass}>
      <Media
        className="absolute inset-0 size-full"
        fill
        pictureClassName="absolute inset-0 block size-full overflow-hidden rounded-full"
        imgClassName="size-full rounded-full object-cover"
        priority
        resource={image}
        size={
          variant === 'stack'
            ? '(max-width: 640px) 8.5rem, 11rem'
            : '(max-width: 1024px) 14rem, 16rem'
        }
      />
    </div>
  )

  if (href?.trim()) {
    return (
      <SmartLink className="block w-fit max-w-full shrink-0" href={href.trim()}>
        {media}
      </SmartLink>
    )
  }

  return media
}

export const AIEcosystemMapBlockComponent: React.FC<Props> = ({
  heading,
  centerImage,
  centerImageHref,
  disableInnerContainer,
  ...rest
}) => {
  const centerMedia = typeof centerImage === 'object' && centerImage ? centerImage : null

  if (!centerMedia) {
    return null
  }

  const cards = desktopCardPlacements
    .map(({ key }) => resolveCard(rest[key], key))
    .filter((card): card is ResolvedCard => Boolean(card))

  const orbitCenterX = 50
  const orbitCenterY = 45
  const orbitRadiusX = 40
  const orbitRadiusY = 35
  const labelOrbitRadiusX = 20
  const labelOrbitRadiusY = 22

  /** Mobile (<lg): label ring inside a square map — % like desktop (left ↔ width, top ↔ height). */
  const mobileMapCenterX = 50
  const mobileMapCenterY = 50
  const mobileLabelRingRx = 36
  const mobileLabelRingRy = 38

  const centerLabelFields = rest as CenterLabelRestFields

  const labelMap: Record<LabelKey, ResolvedLabel | null> = {
    centerTopLeftLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerTopLeftLabel),
      asCenterLabelHrefValue(centerLabelFields.centerTopLeftLabelHref),
    ),
    centerTopMiddleLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerTopMiddleLabel),
      asCenterLabelHrefValue(centerLabelFields.centerTopMiddleLabelHref),
    ),
    centerTopRightLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerTopRightLabel),
      asCenterLabelHrefValue(centerLabelFields.centerTopRightLabelHref),
    ),
    centerMiddleLeftLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerMiddleLeftLabel),
      asCenterLabelHrefValue(centerLabelFields.centerMiddleLeftLabelHref),
    ),
    centerMiddleRightLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerMiddleRightLabel),
      asCenterLabelHrefValue(centerLabelFields.centerMiddleRightLabelHref),
    ),
    centerRightUpperLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerRightUpperLabel),
      asCenterLabelHrefValue(centerLabelFields.centerRightUpperLabelHref),
    ),
    centerBottomLeftLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerBottomLeftLabel),
      asCenterLabelHrefValue(centerLabelFields.centerBottomLeftLabelHref),
    ),
    centerBottomMiddleLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerBottomMiddleLabel),
      asCenterLabelHrefValue(centerLabelFields.centerBottomMiddleLabelHref),
    ),
    centerBottomRightLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerBottomRightLabel),
      asCenterLabelHrefValue(centerLabelFields.centerBottomRightLabelHref),
    ),
    centerBottomFarLeftLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerBottomFarLeftLabel),
      asCenterLabelHrefValue(centerLabelFields.centerBottomFarLeftLabelHref),
    ),
    centerBottomFarRightLabel: resolveLabel(
      asCenterLabelValue(centerLabelFields.centerBottomFarRightLabel),
      asCenterLabelHrefValue(centerLabelFields.centerBottomFarRightLabelHref),
    ),
  }

  return (
    <section className={cn(!disableInnerContainer && 'container mb-0 md:-mb-10')}>
      <div className="mx-auto max-w-[1180px]">
        <div className="hidden lg:block">
          <h2 className="text-center font-serif text-lg md:text-2xl font-semibold uppercase tracking-[0.08em] text-teal-800 mb-0 md:mb-4">
            {heading}
          </h2>
          <div className="relative px-6 pb-8 pt-2 w-full aspect-1100/882">
            {desktopCardPlacements.map((placement, cardIndex) => {
              const card = cards.find((item) => item.key === placement.key)
              if (!card) return null

              const angle = ((Math.PI * 2) / desktopCardPlacements.length) * cardIndex - Math.PI / 2
              const left = orbitCenterX + orbitRadiusX * Math.cos(angle)
              const top = orbitCenterY + orbitRadiusY * Math.sin(angle)

              return (
                <OrbitCard
                  card={card}
                  className={cn(
                    'absolute w-[132px] -translate-x-1/2 -translate-y-1/2 text-center cursor-pointer hover:scale-105 transition-transform duration-200 ease-out',
                  )}
                  key={placement.key}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                />
              )
            })}

            {desktopLabelPlacements.map((placement, labelIndex) => {
              const label = labelMap[placement.key]
              if (!label) return null

              const angle =
                ((Math.PI * 2) / desktopLabelPlacements.length) * labelIndex - Math.PI / 2
              const left = orbitCenterX + labelOrbitRadiusX * Math.cos(angle)
              const top = orbitCenterY + labelOrbitRadiusY * Math.sin(angle)

              return (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-[17px] font-semibold leading-tight text-foreground cursor-pointer hover:scale-105 transition-transform duration-200 ease-out"
                  key={placement.key}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                >
                  <CenterLabel label={label} />
                </div>
              )
            })}

            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
              <CenterImage href={centerImageHref} image={centerMedia} />
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="px-3 pb-6 pt-2 sm:px-6">
            <h2 className="mb-0 text-balance text-center mt-4 font-serif text-lg font-semibold uppercase leading-snug tracking-[0.06em] text-teal-800 sm:mb-7 sm:text-3xl sm:leading-tight md:text-4xl">
              {heading}
            </h2>

            <div className="relative mx-auto mb-6 aspect-square w-full max-w-[min(100%,19rem)] touch-manipulation sm:mb-8 sm:max-w-[min(100%,22rem)]">
              {desktopLabelPlacements.map((placement, labelIndex) => {
                const label = labelMap[placement.key]
                if (!label) return null

                const angle =
                  ((Math.PI * 2) / desktopLabelPlacements.length) * labelIndex - Math.PI / 2
                const left = mobileMapCenterX + mobileLabelRingRx * Math.cos(angle)
                const top = mobileMapCenterY + mobileLabelRingRy * Math.sin(angle)

                return (
                  <div
                    className="absolute text-sm z-1 max-w-[min(30vw,6.25rem)] -translate-x-1/2 -translate-y-1/2 text-center font-semibold leading-snug text-foreground wrap-break-word sm:max-w-28 sm:text-sm sm:leading-tight"
                    key={placement.key}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                    }}
                  >
                    <CenterLabel label={label} />
                  </div>
                )
              })}

              <div className="absolute left-1/2 top-1/2 z-2 -translate-x-1/2 -translate-y-1/2">
                <CenterImage href={centerImageHref} image={centerMedia} variant="stack" />
              </div>
            </div>

            <div className="mx-auto grid w-full max-w-[520px] grid-cols-3 gap-x-2 gap-y-6 min-[400px]:grid-cols-3 min-[400px]:gap-x-3 sm:max-w-none sm:gap-x-6 sm:gap-y-10">
              {cards.map((card) => (
                <OrbitCard card={card} className="min-w-0" key={card.key} stackLayout />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
