import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { FeaturedPostsSideMediaBlock, Media as MediaType, Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Props = FeaturedPostsSideMediaBlock

const getLatestPosts = cache(async (): Promise<Post[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 4,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs as Post[]
})

const toPostDoc = (value: FeaturedPostsSideMediaBlock['mainPost']): Post | null => {
  if (value && typeof value === 'object') {
    return value as Post
  }

  return null
}

const toSubPostDocs = (value: FeaturedPostsSideMediaBlock['subPosts']): Post[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is Post => typeof item === 'object').slice(0, 2)
}

const SmallRowPromo: React.FC<{
  image: Props['smallRowPromoImage']
  href: Props['smallRowPromoHref']
}> = ({ image, href }) => {
  const media = typeof image === 'object' && image ? image : null
  if (!media) {
    return <div aria-hidden className="hidden min-h-0 sm:block" />
  }

  const raw = typeof href === 'string' ? href.trim() : ''
  const shellClass =
    'group relative flex h-full min-h-[200px] flex-1 flex-col overflow-hidden sm:min-h-0 sm:h-full'
  const inner = (
    <Media
      className="absolute inset-0"
      fill
      imgClassName="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
      resource={media}
      size="(max-width: 768px) 100vw, 33vw"
    />
  )

  return (
    <article className="relative flex min-h-[200px] overflow-hidden sm:min-h-0 sm:h-full sm:flex-col cursor-pointer">
      {!raw ? (
        <div className={shellClass}>{inner}</div>
      ) : (
        <SmartLink className={shellClass} href={raw}>
          {inner}
        </SmartLink>
      )}
    </article>
  )
}

export const FeaturedPostsSideMediaBlockComponent: React.FC<Props> = ({
  mainPost,
  sideMedia,
  sideMediaHref,
  smallRowPromoHref,
  smallRowPromoImage,
  source,
  subPosts,
}) => {
  let posts: Post[] = []

  if (source === 'latest') {
    posts = []
  } else {
    const featuredPost = toPostDoc(mainPost)
    const smallPosts = toSubPostDocs(subPosts)
    posts = featuredPost ? [featuredPost, ...smallPosts] : []
  }

  const _sideMedia = sideMedia as MediaType

  const [featuredPost, ...smallPostsRaw] = posts
  const smallPosts = smallPostsRaw.slice(0, 2)

  return (
    <section className="container">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-stretch lg:gap-5">
            <article className="overflow-hidden sm:col-span-3">
              <Link
                className="group grid grid-cols-1 md:grid-cols-2"
                href={`/posts/${featuredPost.slug}`}
              >
                {typeof featuredPost.meta?.image === 'object' && (
                  <Media
                    className="h-full min-h-48 overflow-hidden md:min-h-0"
                    imgClassName="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    resource={featuredPost.meta.image}
                  />
                )}
                <div className="p-4 lg:p-5">
                  <h3 className="text-base font-semibold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover:underline">
                    {featuredPost.title}
                  </h3>
                  {featuredPost.meta?.description && (
                    <p className="mt-3 text-sm text-muted-foreground lg:text-base">
                      {featuredPost.meta.description}
                    </p>
                  )}
                </div>
              </Link>
            </article>

            {smallPosts.map((post) => (
              <article className="flex h-full min-h-0 flex-col overflow-hidden" key={post.id}>
                <Link className="group flex h-full min-h-0 flex-col" href={`/posts/${post.slug}`}>
                  <div className="pb-2">
                    <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover:underline">
                      {post.title}
                    </h4>
                  </div>
                  {typeof post.meta?.image === 'object' && (
                    <div className="mt-auto overflow-hidden">
                      <Media
                        imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        resource={post.meta.image}
                        size="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                </Link>
              </article>
            ))}
            <SmallRowPromo href={smallRowPromoHref} image={smallRowPromoImage} />
          </div>
        </div>

        <aside className="lg:col-span-3 h-full">
          {(() => {
            const raw = typeof sideMediaHref === 'string' ? sideMediaHref.trim() : ''
            const shellClass = 'group relative block overflow-hidden w-full h-full min-h-[320px]'
            const imgClass = raw
              ? 'h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105'
              : 'h-full w-full object-cover'
            const inner = (
              <Image
                alt={_sideMedia?.alt || ''}
                className={imgClass}
                fill
                sizes="(max-width: 1024px) 100vw, 25vw"
                src={getMediaUrl(_sideMedia?.url, _sideMedia?.updatedAt)}
              />
            )

            if (!raw) {
              return (
                <div className="relative overflow-hidden w-full h-full min-h-[320px]">{inner}</div>
              )
            }

            return (
              <SmartLink className={shellClass} href={raw}>
                {inner}
              </SmartLink>
            )
          })()}
        </aside>
      </div>
    </section>
  )
}

export const FeaturedPostsSideMediaBlockComponentAsync = async (props: Props) => {
  if (props.source !== 'latest') {
    return <FeaturedPostsSideMediaBlockComponent {...props} />
  }

  const latestPosts = await getLatestPosts()
  const [mainPost, ...subPosts] = latestPosts

  return (
    <FeaturedPostsSideMediaBlockComponent
      {...props}
      mainPost={mainPost}
      source="manual"
      subPosts={subPosts.slice(0, 2)}
    />
  )
}
