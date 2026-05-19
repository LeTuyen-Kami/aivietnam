import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Media } from '@/components/Media'
import type {
  ListingCategory,
  ListingsCategoriesGridBlock,
  Media as MediaDoc,
} from '@/payload-types'

type Props = ListingsCategoriesGridBlock

function isMediaDoc(value: unknown): value is MediaDoc {
  return typeof value === 'object' && value !== null && 'url' in value
}

function toCategoryId(value: number | ListingCategory): number {
  return typeof value === 'number' ? value : value.id
}

async function queryCategories(props: Props): Promise<ListingCategory[]> {
  const payload = await getPayload({ config: configPromise })

  if (props.source === 'manual') {
    const selected = Array.isArray(props.categories) ? props.categories : []
    const ids = selected.map(toCategoryId)
    if (!ids.length) return []

    const result = await payload.find({
      collection: 'listing-categories',
      depth: 1,
      limit: ids.length,
      overrideAccess: false,
      pagination: false,
      where: {
        id: {
          in: ids,
        },
      },
    })

    const docMap = new Map<number, ListingCategory>(
      result.docs.map((doc) => [doc.id, doc as ListingCategory]),
    )
    return ids
      .map((id: number) => docMap.get(id))
      .filter((doc): doc is ListingCategory => Boolean(doc))
  }

  const result = await payload.find({
    collection: 'listing-categories',
    depth: 1,
    limit: props.limit || 10,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
  })

  return result.docs as ListingCategory[]
}

export async function ListingsCategoriesGridBlockComponent(props: Props) {
  const categories = await queryCategories(props)
  if (!categories.length) return null

  return (
    <section className="container">
      <div className="container rounded-2xl bg-slate-100/70 px-4 py-6 sm:rounded-3xl sm:px-5 sm:py-8 md:px-8 md:py-10">
        {props.title ? (
          <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl md:text-3xl">
            {props.title}
          </h2>
        ) : null}

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((category) => {
            const thumbnail = isMediaDoc(category.thumbnail) ? category.thumbnail : null
            return (
              <Link
                className="group flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3"
                href={`/listings?category=${encodeURIComponent(category.slug)}`}
                key={category.id}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted shadow-sm transition-transform duration-300 group-hover:scale-[1.03] sm:h-24 sm:w-24 sm:rounded-2xl">
                  {thumbnail ? (
                    <Media fill imgClassName="object-cover" resource={thumbnail} size="96px" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1.5 text-[11px] text-muted-foreground sm:px-2 sm:text-xs">
                      No image
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 max-w-full text-sm font-medium leading-snug text-slate-800 group-hover:text-slate-950 sm:text-[14px] sm:leading-7">
                  {category.title}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
