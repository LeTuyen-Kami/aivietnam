'use client'

import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import type { FC } from 'react'

type ContactRow = NonNullable<NonNullable<Footer['contactLinks']>[number]>

export const ContactLinkRowLabel: FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ContactRow>()
  const label = data?.link?.label
  const n = rowNumber !== undefined ? rowNumber + 1 : ''
  return (
    <div>
      Liên hệ {n}
      {label ? `: ${label}` : ''}
    </div>
  )
}
