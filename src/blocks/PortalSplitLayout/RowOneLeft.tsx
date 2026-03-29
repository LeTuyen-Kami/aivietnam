import type { PortalSplitLayoutBlock } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { cn } from '@/utilities/ui'

import { accentHover, accentTextVarStyle, getAccentStyle } from './accent'
import RowOneCircularInfographic from './RowOneCircularInfographic'
import { SmartLink } from '@/components/SmartLink'

export function RowOneLeft({
  row1CenterGraphic,
  row1GridItems,
  row1LeftAccent,
  row1LeftTitle,
  row1OrbitRadiusMaxPct,
  row1OrbitRadiusMinPct,
  row1TagItems,
}: Pick<
  PortalSplitLayoutBlock,
  | 'row1CenterGraphic'
  | 'row1GridItems'
  | 'row1LeftAccent'
  | 'row1LeftTitle'
  | 'row1OrbitRadiusMaxPct'
  | 'row1OrbitRadiusMinPct'
  | 'row1TagItems'
>) {
  const palette = getAccentStyle(row1LeftAccent ?? 'teal')

  return (
    <div style={accentTextVarStyle(palette.text)}>
      <div className="mb-3 h-1 w-full rounded-sm" style={{ backgroundColor: palette.bar }} />
      {row1LeftTitle && (
        <h2 className="font-serif text-lg font-bold uppercase tracking-wide text-foreground">
          {row1LeftTitle}
        </h2>
      )}
      <RowOneCircularInfographic
        row1CenterGraphic={row1CenterGraphic}
        row1OrbitRadiusMaxPct={row1OrbitRadiusMaxPct}
        row1OrbitRadiusMinPct={row1OrbitRadiusMinPct}
        row1TagItems={row1TagItems}
      />
      {row1GridItems && row1GridItems.length > 0 && (
        <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-sm">
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
                <div className="relative aspect-square overflow-hidden bg-muted">
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
