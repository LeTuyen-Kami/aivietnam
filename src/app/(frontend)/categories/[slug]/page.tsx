import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { cache } from 'react'

import { NewsletterSignupBlock } from '@/blocks/NewsletterSignup/Component'
import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import type { GeneralSetting, Media as MediaDoc, Post } from '@/payload-types'

const PAGE_SIZE = 10
const FEATURED_COUNT = 5

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export default async function CategoryPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug = '' } = await paramsPromise
  const { page: rawPage } = await searchParamsPromise
  const decodedSlug = decodeURIComponent(slug)
  const page = normalizePage(rawPage)
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: decodedSlug,
      },
    },
  })

  const category = categories.docs?.[0]

  if (!category) {
    return (
      <div className="container py-24">
        <h1 className="text-2xl font-semibold">Không tìm thấy danh mục</h1>
      </div>
    )
  }

  const [featuredResult, allCategories, sidebarForm, sidebarPosts, defaultPostAssets] =
    await Promise.all([
      payload.find({
        collection: 'posts',
        depth: 1,
        draft: false,
        limit: FEATURED_COUNT,
        overrideAccess: false,
        pagination: false,
        sort: '-publishedAt',
        where: {
          and: [
            {
              categories: {
                in: [category.id],
              },
            },
            {
              _status: {
                equals: 'published',
              },
            },
          ],
        },
      }),
      queryAllCategories(),
      querySidebarForm(),
      querySidebarPosts(),
      queryPostPageAssetDefaults(),
    ])

  const featuredPosts = featuredResult.docs as Post[]
  const featuredIDs = featuredPosts.map((post) => post.id)
  const mainFeatured = featuredPosts[0]
  const secondaryFeatured = featuredPosts.slice(1, 5)

  const listPosts = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: PAGE_SIZE,
    overrideAccess: false,
    page,
    sort: '-publishedAt',
    where: {
      and: [
        {
          categories: {
            in: [category.id],
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
        ...(featuredIDs.length
          ? [
              {
                id: {
                  not_in: featuredIDs,
                },
              },
            ]
          : []),
      ],
    },
  })

  const sidebarAdBlock = resolveDefaultSidebarAd(defaultPostAssets)
  const totalCategoryPosts = featuredPosts.length + listPosts.totalDocs
  const totalPages = listPosts.totalPages ?? 1
  const currentPage = Math.min(listPosts.page ?? page, totalPages)

  return (
    <article className="container pt-10 lg:pt-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h1 className="mb-1 text-center text-2xl font-semibold uppercase tracking-wide">
            Lưu trữ danh mục: {category.title}
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {totalCategoryPosts} bài viết trong danh mục này
          </p>

          {mainFeatured ? (
            <section className="border-b border-border pb-6">
              <Link
                className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                href={`/posts/${mainFeatured?.slug}`}
              >
                {typeof mainFeatured.meta?.image === 'object' ? (
                  <div className="overflow-hidden border border-border">
                    <Media
                      imgClassName="aspect-[16/9] w-full object-cover transition-transform duration-300 ease-out hover:scale-105"
                      resource={mainFeatured.meta.image}
                      size="(max-width: 768px) 100vw, 560px"
                    />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold leading-tight hover:underline">
                    {mainFeatured.title}
                  </h2>
                  {mainFeatured.meta?.description ? (
                    <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">
                      {mainFeatured.meta.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            </section>
          ) : null}

          {secondaryFeatured.length ? (
            <section className="mt-6 border-b border-border pb-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {secondaryFeatured.map((post) => (
                  <Link
                    className="group min-w-0"
                    href={`/posts/${post?.slug}`}
                    key={`secondary-${post.id}`}
                  >
                    {typeof post.meta?.image === 'object' ? (
                      <div className="overflow-hidden border border-border">
                        <Media
                          imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          resource={post.meta.image}
                          size="(max-width: 768px) 50vw, 220px"
                        />
                      </div>
                    ) : null}
                    <h3 className="mt-2 line-clamp-3 text-sm font-medium leading-snug group-hover:underline">
                      {post.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6">
            {listPosts.docs.length ? (
              <div className="space-y-5">
                {(listPosts.docs as Post[]).map((post) => (
                  <Link
                    className="group grid gap-4 border-b border-border pb-5 md:grid-cols-[220px_minmax(0,1fr)]"
                    href={`/posts/${post?.slug}`}
                    key={`list-${post.id}`}
                  >
                    {typeof post.meta?.image === 'object' ? (
                      <div className="overflow-hidden border border-border">
                        <Media
                          imgClassName="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          resource={post.meta.image}
                          size="(max-width: 768px) 100vw, 220px"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-xl font-semibold leading-tight group-hover:underline">
                        {post.title}
                      </h3>
                      {post.meta?.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {post.meta.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Danh mục này chưa có thêm bài viết.</p>
            )}

            {totalPages > 1 ? (
              <nav
                aria-label="Phân trang bài viết"
                className="mt-8 flex items-center justify-center gap-2 text-sm"
              >
                <PaginationLink
                  currentPage={currentPage}
                  label="Trước"
                  page={currentPage - 1}
                  slug={decodedSlug}
                  totalPages={totalPages}
                />
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationLink
                    currentPage={currentPage}
                    key={`page-${pageNumber}`}
                    label={String(pageNumber)}
                    page={pageNumber}
                    slug={decodedSlug}
                    totalPages={totalPages}
                  />
                ))}
                <PaginationLink
                  currentPage={currentPage}
                  label="Sau"
                  page={currentPage + 1}
                  slug={decodedSlug}
                  totalPages={totalPages}
                />
              </nav>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <section className="border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase">Danh mục</h2>
            <div className="space-y-2 text-sm">
              {allCategories.map((item) => (
                <Link
                  className="block hover:underline"
                  href={`/categories/${item.slug}`}
                  key={`sidebar-category-${item.id}`}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase">Tin xem nhiều</h2>
            <div className="space-y-3">
              {sidebarPosts.map((post) => (
                <Link
                  className="group flex items-start gap-2"
                  href={`/posts/${post?.slug}`}
                  key={`side-${post.id}`}
                >
                  {typeof post.meta?.image === 'object' ? (
                    <div className="w-20 shrink-0 overflow-hidden">
                      <Media
                        imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        resource={post.meta.image}
                        size="80px"
                      />
                    </div>
                  ) : null}
                  <p className="line-clamp-3 text-xs leading-snug group-hover:underline">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {sidebarAdBlock ? (
            <section>
              {sidebarAdBlock.href ? (
                <SmartLink className="block" href={sidebarAdBlock.href}>
                  <Media
                    imgClassName="w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.02]"
                    resource={sidebarAdBlock.resource}
                    size="(max-width: 1024px) 100vw, 320px"
                  />
                </SmartLink>
              ) : (
                <Media
                  imgClassName="w-full object-cover"
                  resource={sidebarAdBlock.resource}
                  size="(max-width: 1024px) 100vw, 320px"
                />
              )}
            </section>
          ) : null}
        </aside>
      </div>

      {sidebarForm ? (
        <NewsletterSignupBlock
          className="my-8"
          description="Đăng ký để nhận bản tin AI nổi bật mỗi ngày."
          emailPlaceholder="Nhập email của bạn"
          eyebrow="Đọc trên AIVIETNAM"
          form={sidebarForm}
          headline="Đừng bỏ lỡ tin AI quan trọng"
          submitLabel="Đăng ký"
        />
      ) : null}
    </article>
  )
}

function normalizePage(rawPage?: string): number {
  if (!rawPage) return 1
  const parsed = Number(rawPage)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

function PaginationLink(props: {
  slug: string
  page: number
  currentPage: number
  label: string
  totalPages: number
}) {
  const { slug, page, currentPage, label, totalPages } = props

  if ((label === 'Trước' && currentPage <= 1) || (label === 'Sau' && currentPage >= totalPages)) {
    return (
      <span className="rounded border border-border px-3 py-1 text-muted-foreground opacity-60">
        {label}
      </span>
    )
  }

  if (label === 'Sau' && page === currentPage + 1) {
    return (
      <Link
        className="rounded border border-border px-3 py-1 hover:bg-muted"
        href={`/categories/${slug}?page=${page}`}
      >
        {label}
      </Link>
    )
  }

  if (label === 'Trước') {
    return (
      <Link
        className="rounded border border-border px-3 py-1 hover:bg-muted"
        href={`/categories/${slug}?page=${page}`}
      >
        {label}
      </Link>
    )
  }

  if (label !== 'Trước' && label !== 'Sau' && page === currentPage) {
    return (
      <span className="rounded border border-foreground px-3 py-1 font-semibold text-foreground">
        {label}
      </span>
    )
  }

  return (
    <Link
      className="rounded border border-border px-3 py-1 hover:bg-muted"
      href={`/categories/${slug}?page=${page}`}
    >
      {label}
    </Link>
  )
}

function isPopulatedMedia(value: unknown): value is MediaDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    (typeof (value as { id: unknown }).id === 'number' ||
      typeof (value as { id: unknown }).id === 'string')
  )
}

function resolveDefaultSidebarAd(
  defaults: GeneralSetting['postPageAssets'] | null | undefined,
): { resource: MediaDoc; href?: string } | null {
  if (!defaults || !isPopulatedMedia(defaults.sidebarAdImage)) {
    return null
  }

  const href = defaults.sidebarAdHref?.trim()
  return href ? { resource: defaults.sidebarAdImage, href } : { resource: defaults.sidebarAdImage }
}

const queryPostPageAssetDefaults = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const doc = await payload.findGlobal({
    slug: 'general-settings',
    depth: 2,
    overrideAccess: false,
  })

  return doc.postPageAssets
})

const querySidebarPosts = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: 6,
    overrideAccess: false,
    pagination: false,
    sort: '-views',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs as Post[]
})

const querySidebarForm = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'forms',
    depth: 1,
    limit: 1,
    pagination: false,
    sort: '-createdAt',
  })

  return result.docs?.[0] ?? null
})

const queryAllCategories = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    select: {
      id: true,
      title: true,
      slug: true,
    },
  })

  return result.docs
})

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const title = decodeURIComponent(slug)

  return {
    title: `Danh mục: ${title}`,
  }
}
