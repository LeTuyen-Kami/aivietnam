import type { Media, PortalSplitLayoutBlock } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { accentHover, accentTextVarStyle, getAccentStyleWithCustomHex } from './accent'
import { SmartLink } from '@/components/SmartLink'

export function RowOneRight({
  row1RightAccent,
  row1RightAccentCustomHex,
  row1RightCards,
  row1RightTitle,
}: Pick<
  PortalSplitLayoutBlock,
  'row1RightAccent' | 'row1RightAccentCustomHex' | 'row1RightCards' | 'row1RightTitle'
>) {
  const palette = getAccentStyleWithCustomHex(row1RightAccent ?? 'purple', row1RightAccentCustomHex)

  return (
    <div style={accentTextVarStyle(palette.text)}>
      <div className="mb-3 h-0.5 w-full rounded-sm" style={{ backgroundColor: palette.bar }} />
      {row1RightTitle && (
        <h2
          className="mb-6 font-serif text-lg font-bold uppercase tracking-wide text-foreground text-center"
          style={{
            color: palette.text,
          }}
        >
          {row1RightTitle}
        </h2>
      )}
      {row1RightCards && row1RightCards.length > 0 && (
        <div className="grid grid-cols-2 gap-8">
          {row1RightCards.map((card, index) => {
            const href = card.href?.trim()
            const key = card.id != null ? `${card.id}-${index}` : `${card.caption}-${index}`
            const captionClass = [
              'mt-2 text-center font-serif text-sm font-semibold leading-snug text-foreground transition-colors duration-200',
              accentHover.group,
              href ? 'group-hover:underline underline-offset-2' : '',
            ]
              .filter(Boolean)
              .join(' ')

            const cardContent = (
              <>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {typeof card.image === 'object' && (
                    <MediaComponent
                      className="h-full w-full"
                      imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105 size-full"
                      resource={card.image as Media}
                      size="(max-width: 1024px) 50vw, 25vw"
                    />
                  )}
                </div>

                <p className={captionClass}>{card.caption}</p>
              </>
            )

            return href ? (
              <SmartLink className="group block cursor-pointer" href={href} key={key}>
                {cardContent}
              </SmartLink>
            ) : (
              <div className="group block cursor-pointer" key={key}>
                {cardContent}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
