import type { Metadata } from 'next'
import Link from 'next/link'

import type { Listing, ListingCategory } from '@/payload-types'
import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import { ListingCard } from '@/components/Listings/ListingCard'
import { cn } from '@/utilities/ui'

const PAGE_SIZE = 10

const SORT_OPTIONS = [
  { label: 'Mặc định', value: 'default' },
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Cập nhật gần đây', value: 'updated' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']
type ListingTypeValue = NonNullable<Listing['listingType']>

const LISTING_TYPE_OPTIONS: { label: string; value: ListingTypeValue }[] = [
  { label: 'Cần việc', value: 'job-seeking' },
  { label: 'Tuyển dụng', value: 'job-offer' },
  { label: 'Dịch vụ', value: 'service' },
  { label: 'Khác', value: 'other' },
]

type Args = {
  searchParams: Promise<{
    category?: string
    city?: string
    district?: string
    listingType?: string
    page?: string
    sort?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function ListingsPage({ searchParams: searchParamsPromise }: Args) {
  const {
    category: rawCategory,
    city: rawCity,
    district: rawDistrict,
    listingType: rawListingType,
    page: rawPage,
    sort: rawSort,
  } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })
  const category = normalizeText(rawCategory)
  const city = normalizeText(rawCity)
  const district = normalizeText(rawDistrict)
  const listingType = normalizeListingType(rawListingType)
  const page = normalizePage(rawPage)
  const sort = normalizeSort(rawSort)
  const selectedCategory = category
    ? ((
        await payload.find({
          collection: 'listing-categories',
          limit: 1,
          overrideAccess: false,
          pagination: false,
          where: {
            slug: {
              equals: category,
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
          },
        })
      ).docs[0] ?? null)
    : null

  const [listings, typeFacetDocs, categoryFacetDocs, cityFacetDocs, districtFacetDocs] =
    await Promise.all([
      payload.find({
        collection: 'listings',
        depth: 1,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        sort: sortToPayload(sort),
        where: buildWhere({ categoryId: selectedCategory?.id, city, district, listingType }),
        select: {
          title: true,
          slug: true,
          summary: true,
          priceLabel: true,
          city: true,
          district: true,
          categories: true,
          createdAt: true,
          thumbnail: true,
          gallery: true,
          contactName: true,
        },
      }),
      payload.find({
        collection: 'listings',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        sort: 'listingType',
        where: buildWhere({ categoryId: selectedCategory?.id, city, district }),
        select: {
          listingType: true,
        },
      }),
      payload.find({
        collection: 'listings',
        depth: 1,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        sort: 'city',
        where: buildWhere({ city, district, listingType }),
        select: {
          categories: true,
        },
      }),
      payload.find({
        collection: 'listings',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        sort: 'city',
        where: buildWhere({ categoryId: selectedCategory?.id, listingType }),
        select: {
          city: true,
        },
      }),
      payload.find({
        collection: 'listings',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        sort: 'district',
        where: buildWhere({ categoryId: selectedCategory?.id, city, listingType }),
        select: {
          district: true,
        },
      }),
    ])

  const listingTypeCounts = typeFacetDocs.docs.reduce<Record<string, number>>((acc, item) => {
    const key = normalizeListingType(item.listingType)
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const districtCounts = districtFacetDocs.docs.reduce<Record<string, number>>((acc, item) => {
    const key = normalizeText(item.district)
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const cityCounts = cityFacetDocs.docs.reduce<Record<string, number>>((acc, item) => {
    const key = normalizeText(item.city)
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const categoryCounts = categoryFacetDocs.docs.reduce<Record<string, number>>((acc, item) => {
    for (const itemCategory of extractCategories(item.categories)) {
      acc[itemCategory.slug] = (acc[itemCategory.slug] ?? 0) + 1
    }
    return acc
  }, {})
  const listingTypeEntries = LISTING_TYPE_OPTIONS.map((item) => ({
    ...item,
    count: listingTypeCounts[item.value] ?? 0,
  })).filter((item) => item.count > 0)

  const categoryEntries = Array.from(
    new Map(
      categoryFacetDocs.docs.flatMap((item) =>
        extractCategories(item.categories).map((itemCategory) => [
          itemCategory.slug,
          {
            slug: itemCategory.slug,
            title: itemCategory.title,
            count: categoryCounts[itemCategory.slug] ?? 0,
          },
        ]),
      ),
    ).values(),
  ).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'vi'))
  const cityEntries = Object.entries(cityCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'),
  )
  const districtEntries = Object.entries(districtCounts).sort((a, b) =>
    a[0].localeCompare(b[0], 'vi'),
  )
  const currentPage = Math.min(listings.page ?? page, listings.totalPages || 1)
  const totalListingsMatchingPrimaryFilters = Object.values(listingTypeCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const selectedListingTypeLabel =
    LISTING_TYPE_OPTIONS.find((item) => item.value === listingType)?.label ?? ''
  const heading = selectedCategory?.title || selectedListingTypeLabel || city || 'Sàn giao dịch AI'
  const hasActiveFilters = Boolean(
    category || city || district || listingType || sort !== 'default',
  )

  return (
    <div className="bg-slate-50/70 pb-8 pt-6 max-md:px-4 md:pb-10 md:pt-10">
      <section className="container">
        <h1 className="text-lg font-semibold tracking-tight text-balance md:text-xl">{heading}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:mt-3">
          Lọc theo loại tin, chuyên môn và khu vực để tìm đúng nhu cầu nhanh hơn.
        </p>
      </section>

      <section className="container mt-6 md:mt-8">
        <div className="rounded-lg border border-border bg-background p-3 shadow-sm md:p-4">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6 md:gap-y-0">
            <FilterChip
              active={!listingType}
              count={totalListingsMatchingPrimaryFilters}
              href={buildQueryHref({ category, city, district, sort, page: 1 })}
              label="Tất cả loại tin"
            />
            {listingTypeEntries.map((entry) => (
              <FilterChip
                active={listingType === entry.value}
                count={entry.count}
                href={buildQueryHref({
                  category,
                  city,
                  district,
                  listingType: entry.value,
                  page: 1,
                  sort,
                })}
                key={entry.value}
                label={entry.label}
              />
            ))}
          </div>

          <div className="my-2 border-t border-border" />

          <div className="flex flex-wrap gap-x-3 gap-y-3 text-sm leading-6 md:gap-x-4 md:gap-y-4">
            <FilterChip
              active={!category}
              count={Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)}
              href={buildQueryHref({ city, district, listingType, sort, page: 1 })}
              label="Tất cả ngành nghề"
            />
            {categoryEntries.map((entry) => (
              <FilterChip
                active={category === entry.slug}
                count={entry.count}
                href={buildQueryHref({
                  category: entry.slug,
                  city,
                  district,
                  listingType,
                  sort,
                  page: 1,
                })}
                key={entry.slug}
                label={entry.title}
              />
            ))}
          </div>

          <div className="my-2 border-t border-border" />

          <form
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            method="get"
          >
            {category ? <input name="category" type="hidden" value={category} /> : null}
            {listingType ? <input name="listingType" type="hidden" value={listingType} /> : null}
            <label
              className="grid gap-2 text-sm font-medium text-foreground"
              htmlFor="listings-city"
            >
              Tỉnh / thành
              <select
                className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-normal outline-none cursor-pointer"
                defaultValue={city}
                id="listings-city"
                name="city"
              >
                <option value="">Toàn quốc</option>
                {cityEntries.map(([name, count]) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))}
              </select>
            </label>

            <label
              className="grid gap-2 text-sm font-medium text-foreground"
              htmlFor="listings-district"
            >
              Quận / huyện
              <select
                className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-normal outline-none cursor-pointer"
                defaultValue={district}
                disabled={!city}
                id="listings-district"
                name="district"
              >
                <option value="">{city ? 'Tất cả quận / huyện' : 'Chọn thành phố trước'}</option>
                {districtEntries.map(([name, count]) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))}
              </select>
            </label>

            <label
              className="grid gap-2 text-sm font-medium text-foreground"
              htmlFor="listings-sort"
            >
              Sắp xếp
              <select
                className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-normal outline-none cursor-pointer"
                defaultValue={sort}
                id="listings-sort"
                name="sort"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted cursor-pointer md:w-auto"
                type="submit"
              >
                Áp dụng
              </button>
              {hasActiveFilters ? (
                <Link
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:w-auto"
                  href="/listings"
                >
                  Xóa bộ lọc
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="container mt-8 md:mt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-base font-semibold leading-snug text-balance md:text-xl md:leading-normal">
            {listings.totalDocs} tin
            {selectedCategory ? ` thuộc ${selectedCategory.title.toLowerCase()}` : ''}
            {listingType ? ` dạng ${selectedListingTypeLabel.toLowerCase()}` : ''}
            {city ? ` tại ${city.toLowerCase()}` : ' trên toàn quốc'}
            {district ? `, ${district.toLowerCase()}` : ''}
          </p>
        </div>
      </section>

      <section className="container mt-6 md:mt-8">
        {listings.docs.length ? (
          <div className="space-y-4">
            {listings.docs.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground md:px-6 md:py-12">
            Không có tin đăng phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </section>

      {listings.totalPages > 1 ? (
        <section className="container mt-8 md:mt-10">
          <nav
            aria-label="Phân trang listings"
            className="flex max-w-full flex-wrap items-center justify-center gap-1.5 md:gap-2"
          >
            <PaginationQueryLink
              category={category}
              city={city}
              currentPage={currentPage}
              district={district}
              label="Trước"
              listingType={listingType}
              page={currentPage - 1}
              sort={sort}
              totalPages={listings.totalPages}
            />
            {Array.from({ length: listings.totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <PaginationQueryLink
                  category={category}
                  city={city}
                  currentPage={currentPage}
                  district={district}
                  key={pageNumber}
                  label={String(pageNumber)}
                  listingType={listingType}
                  page={pageNumber}
                  sort={sort}
                  totalPages={listings.totalPages}
                />
              ),
            )}
            <PaginationQueryLink
              category={category}
              city={city}
              currentPage={currentPage}
              district={district}
              label="Sau"
              listingType={listingType}
              page={currentPage + 1}
              sort={sort}
              totalPages={listings.totalPages}
            />
          </nav>
        </section>
      ) : null}
    </div>
  )
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : ''
}

function extractCategories(value?: (number | ListingCategory)[] | null) {
  return (value ?? []).filter(
    (item): item is ListingCategory =>
      typeof item === 'object' && item !== null && 'slug' in item && 'title' in item,
  )
}

function normalizePage(value?: string) {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

function normalizeSort(value?: string): SortValue {
  const fallback: SortValue = 'default'
  return SORT_OPTIONS.some((item) => item.value === value) ? (value as SortValue) : fallback
}

function normalizeListingType(value?: string | null): ListingTypeValue | '' {
  return LISTING_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ListingTypeValue)
    : ''
}

function sortToPayload(value: SortValue) {
  switch (value) {
    case 'oldest':
      return 'createdAt'
    case 'updated':
      return '-updatedAt'
    case 'newest':
    case 'default':
    default:
      return '-createdAt'
  }
}

function buildWhere({
  categoryId,
  city,
  district,
  listingType,
}: {
  categoryId?: number | string
  city?: string
  district?: string
  listingType?: ListingTypeValue | ''
}) {
  const and: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
    {
      statusLabel: {
        equals: 'available',
      },
    },
  ]

  if (listingType) {
    and.push({
      listingType: {
        equals: listingType,
      },
    })
  }

  if (categoryId) {
    and.push({
      categories: {
        in: [categoryId],
      },
    })
  }

  if (city) {
    and.push({
      city: {
        equals: city,
      },
    })
  }

  if (district) {
    and.push({
      district: {
        equals: district,
      },
    })
  }

  return { and }
}

function buildQueryHref({
  category,
  city,
  district,
  listingType,
  sort,
  page,
}: {
  category?: string
  city?: string
  district?: string
  listingType?: ListingTypeValue | ''
  sort: SortValue
  page?: number
}) {
  const params = new URLSearchParams()
  if (city) params.set('city', city)
  if (category) params.set('category', category)
  if (district) params.set('district', district)
  if (listingType) params.set('listingType', listingType)
  if (sort !== 'default') params.set('sort', sort)
  if (page && page > 1) params.set('page', String(page))

  const query = params.toString()
  return query ? `/listings?${query}` : '/listings'
}

function FilterChip({
  active,
  count,
  href,
  label,
}: {
  active?: boolean
  count?: number
  href: string
  label: string
}) {
  return (
    <Link
      className={cn(
        'inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground',
        active && 'font-semibold text-foreground',
      )}
      href={href}
    >
      <span>{label}</span>
      {typeof count === 'number' ? <span className="text-rose-500">{count}</span> : null}
    </Link>
  )
}

function PaginationQueryLink({
  category,
  city,
  currentPage,
  district,
  label,
  listingType,
  page,
  sort,
  totalPages,
}: {
  category?: string
  city?: string
  currentPage: number
  district?: string
  label: string
  listingType?: ListingTypeValue | ''
  page: number
  sort: SortValue
  totalPages: number
}) {
  if (page < 1 || page > totalPages) {
    return (
      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-border px-2.5 text-xs text-muted-foreground/50 md:h-10 md:min-w-10 md:px-4 md:text-sm">
        {label}
      </span>
    )
  }

  const isActive = page === currentPage

  return (
    <Link
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-border px-2.5 text-xs transition-colors hover:bg-background md:h-10 md:min-w-10 md:px-4 md:text-sm',
        isActive && 'bg-foreground text-background hover:bg-foreground',
      )}
      href={buildQueryHref({ category, city, district, listingType, sort, page })}
    >
      {label}
    </Link>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Listings | AIVIETNAM',
    description: 'Danh sách tin đăng AI, tuyển dụng, cần việc và dịch vụ mới nhất trên AIVIETNAM.',
  }
}
