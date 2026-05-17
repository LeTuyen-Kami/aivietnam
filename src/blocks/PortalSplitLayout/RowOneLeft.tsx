import type { PortalSplitLayoutBlock } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { cn } from '@/utilities/ui'

import { SmartLink } from '@/components/SmartLink'
import { accentHover, accentTextVarStyle, getAccentStyleWithCustomHex } from './accent'
import RowOneCircularInfographic from './RowOneCircularInfographic'

export function RowOneLeft({
  row1CenterGraphic,
  row1GridItems,
  row1LeftAccent,
  row1LeftAccentCustomHex,
  row1LeftTitle,
  row1LeftTitleHref,
  row1OrbitRadiusMaxPct,
  row1OrbitRadiusMinPct,
  row1TagItems,
}: Pick<
  PortalSplitLayoutBlock,
  | 'row1CenterGraphic'
  | 'row1GridItems'
  | 'row1LeftAccent'
  | 'row1LeftAccentCustomHex'
  | 'row1LeftTitle'
  | 'row1LeftTitleHref'
  | 'row1OrbitRadiusMaxPct'
  | 'row1OrbitRadiusMinPct'
  | 'row1TagItems'
>) {
  const palette = getAccentStyleWithCustomHex(row1LeftAccent ?? 'teal', row1LeftAccentCustomHex)

  return (
    <div
      style={accentTextVarStyle(palette.text)}
      className="min-w-0 max-w-full md:overflow-hidden md:max-w-screen"
    >
      <div
        className="mb-3 h-0.5 mx-4 md:mx-0 md:w-full rounded-sm"
        style={{ backgroundColor: palette.bar }}
      />
      {row1LeftTitle &&
        (row1LeftTitleHref?.trim() ? (
          <SmartLink className="block text-center" href={row1LeftTitleHref.trim()}>
            <h2
              className="font-serif text-lg font-bold uppercase tracking-wide text-foreground underline-offset-2 hover:underline"
              style={{
                color: palette.text,
              }}
            >
              {row1LeftTitle}
            </h2>
          </SmartLink>
        ) : (
          <h2
            className="font-serif text-lg font-bold uppercase tracking-wide text-foreground text-center"
            style={{
              color: palette.text,
            }}
          >
            {row1LeftTitle}
          </h2>
        ))}
      <RowOneCircularInfographic
        row1CenterGraphic={row1CenterGraphic}
        row1OrbitRadiusMaxPct={row1OrbitRadiusMaxPct}
        row1OrbitRadiusMinPct={row1OrbitRadiusMinPct}
        row1TagItems={row1TagItems}
      />
      {row1GridItems && row1GridItems.length > 0 && (
        <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-sm px-4 md:px-0">
          {row1GridItems.map((cell, index) => {
            const href = cell.href?.trim()
            const key = cell.id != null ? `${cell.id}-${index}` : `${cell.label}-${index}`
            const labelClass = cn(
              'font-serif leading-snug text-foreground transition-colors duration-200 text-center mt-2',
              accentHover.group,
              href && 'group-hover:underline underline-offset-2',
            )

            const inner = (
              <>
                <div className="relative aspect-square overflow-hidden bg-muted rounded-full max-w-[80px] mx-auto">
                  {typeof cell.icon === 'object' && cell.icon && (
                    <MediaComponent
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                      resource={cell.icon}
                      size="(max-width: 1024px) 50vw, 25vw"
                    />
                  )}
                </div>
                <p className={labelClass}>{cell.label}</p>
              </>
            )

            return href ? (
              <SmartLink className="group block cursor-pointer" href={href} key={key}>
                {inner}
              </SmartLink>
            ) : (
              <div className="group block cursor-pointer" key={key}>
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
