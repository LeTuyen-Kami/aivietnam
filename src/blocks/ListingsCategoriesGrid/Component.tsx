import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  ListingsCategoriesGridBlock,
  ListingCategory,
  Media as MediaDoc,
} from '@/payload-types'
import { Media } from '@/components/Media'

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
      <div className="container rounded-3xl bg-slate-100/70 px-5 py-8 md:px-8 md:py-10">
        {props.title ? (
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">{props.title}</h2>
        ) : null}

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((category) => {
            const thumbnail = isMediaDoc(category.thumbnail) ? category.thumbnail : null
            return (
              <Link
                className="group flex flex-col items-center gap-3 text-center"
                href={`/listings?category=${encodeURIComponent(category.slug)}`}
                key={category.id}
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-muted shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
                  {thumbnail ? (
                    <Media fill imgClassName="object-cover" resource={thumbnail} size="96px" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 text-base font-medium leading-7 text-slate-800 group-hover:text-slate-950">
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
