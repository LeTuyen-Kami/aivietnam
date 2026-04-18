'use client'

import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import type { FC } from 'react'

type ColumnRow = NonNullable<NonNullable<Footer['categoryColumns']>[number]>

export const CategoryColumnRowLabel: FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ColumnRow>()
  const preview = data?.links
    ?.slice(0, 2)
    .map((l) => l.link?.label)
    .filter(Boolean)
    .join(', ')

  const n = rowNumber !== undefined ? rowNumber + 1 : ''
  return (
    <div>
      Cột {n}
      {preview ? `: ${preview}…` : ''}
    </div>
  )
}
