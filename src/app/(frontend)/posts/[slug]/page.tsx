import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { GeneralSetting, Media as MediaDoc, Post } from '@/payload-types'

import { NewsletterSignupBlock } from '@/blocks/NewsletterSignup/Component'
import { PostComments } from '@/components/Auth/PostComments'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { formatAuthors } from '@/utilities/formatAuthors'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMeta } from '@/utilities/generateMeta'
import { ChevronRight, Clock, Folder, User } from 'lucide-react'
import PageClient from './page.client'
import { ViewCounter } from './ViewCounter'

export const revalidate = 60

export async function generateStaticParams() {
  // Workaround for Payload + Postgres dev spam:
  // avoid prebuilding params in development to prevent repetitive schema pulls.
  if (process.env.NODE_ENV === 'development') {
    return []
  }

  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const [post, sidebarPosts, sidebarForm, allCategories, postPageDefaults] = await Promise.all([
    queryPostBySlug({ slug: decodedSlug }),
    querySidebarPosts({ currentSlug: decodedSlug }),
    querySidebarForm(),
    queryAllCategories(),
    queryPostPageAssetDefaults(),
  ])

  if (!post) return <PayloadRedirects url={url} />

  const relatedPosts = (post.relatedPosts ?? [])
    .filter((item): item is Post => typeof item === 'object' && item !== null)
    .slice(0, 3)
  const sidebarItems = [...relatedPosts, ...sidebarPosts].filter((item, index, arr) => {
    return arr.findIndex((candidate) => candidate.id === item.id) === index
  })
  const tags = post.categories?.filter(
    (item): item is NonNullable<Post['categories']>[number] & object => {
      return typeof item === 'object' && item !== null
    },
  )
  const authorLabel = post.populatedAuthors?.length ? formatAuthors(post.populatedAuthors) : ''
  const hasAuthors = authorLabel !== ''
  const getCategoryHref = (slug?: string | null) => (slug ? `/categories/${slug}` : '#')

  const footerBlock = resolvePostPageFooter(post, postPageDefaults)
  const sidebarAdBlock = resolvePostPageSidebarAd(post, postPageDefaults)

  return (
    <>
      <article>
        <PageClient />

        {/* Allows redirects for valid pages too */}
        <PayloadRedirects disableNotFound url={url} />

        {draft && <LivePreviewListener />}

        <div className="container min-w-0 px-4 pt-6 sm:px-6 sm:pt-8 lg:pt-14">
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_270px]">
            <div className="min-w-0">
              <nav
                className="mb-3 flex min-w-0 flex-wrap items-center gap-x-1 text-xs text-muted-foreground sm:mb-4 sm:text-sm"
                aria-label="Breadcrumb"
              >
                <Link className="shrink-0 hover:text-foreground hover:underline" href="/">
                  Trang chủ
                </Link>
                {tags?.length ? (
                  <>
                    <ChevronRight aria-hidden className="mx-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                    <Link
                      className="min-w-0 wrap-break-word hover:text-foreground hover:underline"
                      href={getCategoryHref(tags[0].slug)}
                    >
                      {tags[0].title}
                    </Link>
                  </>
                ) : null}
              </nav>

              <h1 className="wrap-break-word text-lg font-semibold leading-snug tracking-tight sm:text-xl md:text-[23px] md:leading-tight">
                {post.title}
              </h1>

              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground sm:mt-4 sm:gap-x-2.5 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <ViewCounter postId={String(post.id)} initialViews={post.views ?? 0} />
                </span>

                {post.publishedAt ? (
                  <>
                    <span aria-hidden className="select-none text-muted-foreground/35">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <time dateTime={post.publishedAt}>{formatDateTime(post.publishedAt)}</time>
                    </span>
                  </>
                ) : null}

                {tags?.length ? (
                  <>
                    <span aria-hidden className="select-none text-muted-foreground/35">
                      ·
                    </span>
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                      <Folder aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="min-w-0 leading-snug">
                        {tags.map((tag, index) => (
                          <React.Fragment key={tag.id}>
                            {index > 0 ? (
                              <span className="text-muted-foreground/50">, </span>
                            ) : null}
                            <Link
                              className="wrap-break-word underline-offset-2 hover:text-foreground hover:underline"
                              href={getCategoryHref(tag.slug)}
                            >
                              {tag.title}
                            </Link>
                          </React.Fragment>
                        ))}
                      </span>
                    </span>
                  </>
                ) : null}

                {hasAuthors ? (
                  <>
                    <span aria-hidden className="select-none text-muted-foreground/35">
                      ·
                    </span>
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                      <User aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="wrap-break-word leading-snug">{authorLabel}</span>
                    </span>
                  </>
                ) : null}
              </div>

              {post.heroImage && typeof post.heroImage !== 'string' ? (
                <div className="mt-5 overflow-hidden border border-border sm:mt-6">
                  <Media
                    imgClassName="w-full object-cover"
                    resource={post.heroImage}
                    size="(max-width: 1024px) 100vw, 760px"
                  />
                </div>
              ) : null}

              <RichText
                className="prose-neutral prose-pre:max-w-full prose-pre:overflow-x-auto mt-5 min-w-0 max-w-none sm:mt-6"
                data={post.content}
                enableGutter={false}
              />

              {relatedPosts.length ? (
                <section className="mt-8 border-t border-border pt-5 sm:mt-10 sm:pt-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide sm:mb-4 sm:text-base">
                    Tin liên quan
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    {relatedPosts.map((item) => (
                      <Link
                        className="group flex items-start gap-2.5 border-b border-border pb-3 last:border-none sm:gap-3 sm:pb-4"
                        href={`/posts/${item?.slug}`}
                        key={item.id}
                      >
                        {typeof item.meta?.image === 'object' ? (
                          <div className="w-24 shrink-0 overflow-hidden sm:w-28">
                            <Media
                              imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                              resource={item.meta.image}
                              size="112px"
                            />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-xs font-semibold leading-snug wrap-break-word group-hover:underline sm:text-sm">
                            {item.title}
                          </h3>
                          {item.meta?.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">
                              {item.meta.description}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <PostComments key={post.id} postId={post.id} />

              {tags?.length ? (
                <section className="mt-6 border-t border-border pt-4 sm:mt-8 sm:pt-5">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags.map((category) => (
                      <Link
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground wrap-break-word sm:px-3 sm:text-xs"
                        href={getCategoryHref(category.slug)}
                        key={`tag-${String(category.id)}`}
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {footerBlock ? (
                <div className="mt-6 overflow-hidden border border-border sm:mt-8">
                  {footerBlock.href ? (
                    <SmartLink className="block" href={footerBlock.href}>
                      <Media
                        imgClassName="w-full object-cover"
                        resource={footerBlock.resource}
                        size="(max-width: 1024px) 100vw, 760px"
                      />
                    </SmartLink>
                  ) : (
                    <Media
                      imgClassName="w-full object-cover"
                      resource={footerBlock.resource}
                      size="(max-width: 1024px) 100vw, 760px"
                    />
                  )}
                </div>
              ) : null}
            </div>

            <aside className="min-w-0 w-full space-y-6 border-t border-border pt-6 sm:space-y-8 sm:pt-8 lg:sticky lg:top-24 lg:h-fit lg:w-[270px] lg:border-t-0 lg:pt-0">
              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-tight text-foreground sm:mb-3 sm:text-[15px]">
                  Danh mục
                </h2>
                <div className="border-t border-border/60">
                  {allCategories.map((category) => (
                    <Link
                      className="block border-b border-border/60 py-2 text-sm leading-6 text-foreground wrap-break-word transition-colors hover:text-primary sm:text-[15px]"
                      href={getCategoryHref(category.slug)}
                      key={`sidebar-category-${String(category.id)}`}
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-tight text-foreground sm:mb-3 sm:text-[15px]">
                  Tin xem nhiều
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {sidebarItems.slice(0, 6).map((item) => (
                    <Link
                      className="group flex min-w-0 items-start gap-2 sm:gap-2.5"
                      href={`/posts/${item?.slug}`}
                      key={`side-${item.id}`}
                    >
                      {typeof item.meta?.image === 'object' ? (
                        <div className="w-[72px] shrink-0 overflow-hidden bg-muted sm:w-[84px]">
                          <Media
                            imgClassName="aspect-[84/56] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            resource={item.meta.image}
                            size="84px"
                          />
                        </div>
                      ) : null}
                      <p className="min-w-0 flex-1 line-clamp-3 text-sm leading-6 text-foreground wrap-break-word transition-colors group-hover:text-primary sm:text-[15px]">
                        {item.title}
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
        </div>
        {sidebarForm ? (
          <NewsletterSignupBlock
            description="Đăng ký để nhận bản tin AI nổi bật mỗi ngày."
            emailPlaceholder="Nhập email của bạn"
            eyebrow="Đọc trên AIVIETNAM"
            form={sidebarForm}
            headline="Đừng bỏ lỡ tin AI quan trọng"
            submitLabel="Đăng ký"
            className="my-6 sm:my-8"
          />
        ) : null}
      </article>
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

function isPopulatedMedia(value: unknown): value is MediaDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as { id: unknown }).id === 'number'
  )
}

function resolvePostPageFooter(
  post: Post,
  defaults: GeneralSetting['postPageAssets'] | null | undefined,
): { resource: MediaDoc; href?: string } | null {
  if (isPopulatedMedia(post.footerImage)) {
    const href = post.footerImageHref?.trim()
    return href ? { resource: post.footerImage, href } : { resource: post.footerImage }
  }
  if (defaults && isPopulatedMedia(defaults.footerImage)) {
    const href = defaults.footerImageHref?.trim()
    return href ? { resource: defaults.footerImage, href } : { resource: defaults.footerImage }
  }
  return null
}

function resolvePostPageSidebarAd(
  post: Post,
  defaults: GeneralSetting['postPageAssets'] | null | undefined,
): { resource: MediaDoc; href?: string } | null {
  if (isPopulatedMedia(post.sidebarAdImage)) {
    const href = post.sidebarAdHref?.trim()
    return href ? { resource: post.sidebarAdImage, href } : { resource: post.sidebarAdImage }
  }
  if (defaults && isPopulatedMedia(defaults.sidebarAdImage)) {
    const href = defaults.sidebarAdHref?.trim()
    return href
      ? { resource: defaults.sidebarAdImage, href }
      : { resource: defaults.sidebarAdImage }
  }
  return null
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

const querySidebarPosts = cache(async ({ currentSlug }: { currentSlug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: 6,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [
        {
          slug: {
            not_equals: currentSlug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return result.docs
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
