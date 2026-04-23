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

function OrbitCard({
  card,
  className,
  style,
}: {
  card: ResolvedCard
  className?: string
  style?: React.CSSProperties
}) {
  const imageNode = (
    <div className="relative mx-auto mb-3 h-18 w-18 overflow-hidden rounded-full bg-muted shadow-sm sm:size-20 lg:size-16">
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
      <h3 className="text-center text-[15px] font-medium leading-tight text-foreground sm:text-base lg:text-[17px]">
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

function CenterImage({ image, href }: { image: MediaType; href?: string | null }) {
  const media = (
    <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full bg-muted sm:h-52 sm:w-52 lg:h-[220px] lg:w-[220px]">
      <Media
        className="absolute inset-0"
        fill
        imgClassName="h-full w-full object-cover"
        priority
        resource={image}
        size="(max-width: 1024px) 14rem, 16rem"
      />
    </div>
  )

  if (href?.trim()) {
    return (
      <SmartLink className="block" href={href.trim()}>
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

  const labelMap: Record<LabelKey, string> = {
    centerTopLeftLabel: rest.centerTopLeftLabel,
    centerTopMiddleLabel: rest.centerTopMiddleLabel,
    centerTopRightLabel: rest.centerTopRightLabel,
    centerMiddleLeftLabel: rest.centerMiddleLeftLabel,
    centerMiddleRightLabel: rest.centerMiddleRightLabel,
    centerRightUpperLabel: rest.centerRightUpperLabel,
    centerBottomLeftLabel: rest.centerBottomLeftLabel,
    centerBottomMiddleLabel: rest.centerBottomMiddleLabel,
    centerBottomRightLabel: rest.centerBottomRightLabel,
    centerBottomFarLeftLabel: rest.centerBottomFarLeftLabel,
    centerBottomFarRightLabel: rest.centerBottomFarRightLabel,
  }

  return (
    <section className={cn(!disableInnerContainer && 'container ')}>
      <div className="mx-auto max-w-[1180px]">
        <div className="hidden lg:block">
          <h2 className="text-center font-serif text-2xl font-semibold uppercase tracking-[0.08em] text-teal-800 mb-4">
            {heading}
          </h2>
          <div className="relative px-6 pb-8 pt-2 min-h-[calc(100vh-81px)]">
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
              const label = labelMap[placement.key]?.trim()
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
                  {label}
                </div>
              )
            })}

            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
              <CenterImage href={centerImageHref} image={centerMedia} />
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="px-4 pb-4 pt-2 sm:px-6">
            <h2 className="mb-7 text-center font-serif text-3xl font-semibold uppercase leading-tight tracking-[0.06em] text-teal-800 sm:text-4xl">
              {heading}
            </h2>

            <div className="mx-auto mb-6 grid max-w-[460px] grid-cols-3 gap-x-4 gap-y-3 text-center">
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerTopLeftLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerTopMiddleLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerTopRightLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerMiddleLeftLabel}
              </div>
              <div className="row-span-2 flex items-center justify-center">
                <CenterImage href={centerImageHref} image={centerMedia} />
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerMiddleRightLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerBottomLeftLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerRightUpperLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerBottomFarLeftLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerBottomMiddleLabel}
              </div>
              <div className="text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerBottomRightLabel}
              </div>
              <div className="col-start-3 text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {labelMap.centerBottomFarRightLabel}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {cards.map((card) => (
                <OrbitCard card={card} className="min-w-0" key={card.key} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
