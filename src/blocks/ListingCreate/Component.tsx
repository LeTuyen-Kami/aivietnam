import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { ListingCreateClient } from '@/blocks/ListingCreate/Component.client'
import type { ListingCategory, ListingCreateBlock } from '@/payload-types'

type Props = ListingCreateBlock

export async function ListingCreateBlockComponent(props: Props) {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'listing-categories',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    select: {
      id: true,
      title: true,
    },
  })

  return (
    <ListingCreateClient
      buttonLabel={props.buttonLabel || 'Đăng tin'}
      categories={categories.docs as Pick<ListingCategory, 'id' | 'title'>[]}
      modalDescription={props.modalDescription || undefined}
      modalTitle={props.modalTitle || 'Đăng tin mới'}
      successMessage={props.successMessage || undefined}
    />
  )
}
