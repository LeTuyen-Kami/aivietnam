'use client'

import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import type { FC } from 'react'

type LinkRow = NonNullable<NonNullable<NonNullable<Footer['categoryColumns']>[number]['links']>[number]>

export const RowLabel: FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<LinkRow>()
  const label = data?.link?.label
  const prefix = rowNumber !== undefined ? `Link ${rowNumber + 1}` : 'Link'

  return <div>{label ? `${prefix}: ${label}` : prefix}</div>
}
