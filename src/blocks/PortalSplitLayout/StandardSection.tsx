import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'

import { cn } from '@/utilities/ui'
import { accentHover, accentTextVarStyle, getAccentStyleWithCustomHex } from './accent'
import { PostExcerpt } from './PostExcerpt'
import type { SectionAccent } from './types'

export function StandardSection({
  accent,
  accentCustomHex,
  featuredPost,
  footerPosts,
  sectionTitle,
  sectionTitleHref,
  subPosts,
}: {
  accent: SectionAccent
  accentCustomHex?: string | null
  featuredPost: Post | null
  footerPosts: Post[]
  sectionTitle: string
  sectionTitleHref?: string | null
  subPosts: Post[]
}) {
  const palette = getAccentStyleWithCustomHex(accent, accentCustomHex)

  if (!featuredPost) {
    return null
  }

  return (
    <section style={accentTextVarStyle(palette.text)}>
      <div
        className="mb-4 h-0.5 rounded-sm mx-4 md:mx-0"
        style={{ backgroundColor: palette.bar }}
      />
      {sectionTitleHref?.trim() ? (
        <SmartLink className="mb-2 md:mb-6 block mx-4 md:mx-0" href={sectionTitleHref.trim()}>
          <h2
            className="font-serif text-xl font-bold text-foreground underline-offset-2 hover:underline"
            style={{
              color: palette.bar,
            }}
          >
            {sectionTitle}
          </h2>
        </SmartLink>
      ) : (
        <h2
          className="mb-2 md:mb-6 font-serif text-xl font-bold text-foreground mx-4 md:mx-0"
          style={{
            color: palette.bar,
          }}
        >
          {sectionTitle}
        </h2>
      )}

      <div className="group/feat mb-0 grid gap-0 md:mb-8 md:grid-cols-2 md:gap-6">
        <Link className="block overflow-hidden md:col-span-1" href={`/posts/${featuredPost?.slug}`}>
          {typeof featuredPost.meta?.image === 'object' && featuredPost.meta?.image && (
            <MediaComponent
              className="mb-0 overflow-hidden"
              imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover/feat:scale-105"
              resource={featuredPost.meta.image}
              size="(max-width: 768px) 100vw, 40vw"
            />
          )}
        </Link>
        <div className="flex flex-col justify-start px-4 md:px-0  mt-2 md:mt-0 ">
          <Link className="block" href={`/posts/${featuredPost?.slug}`}>
            <h3
              className={cn(
                'font-serif text-lg md:text-xl font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover/feat:underline',
                accentHover.feat,
              )}
            >
              {featuredPost.title}
            </h3>
          </Link>
          <PostExcerpt post={featuredPost} />
        </div>
      </div>

      {subPosts.length > 0 && (
        <div className="mb-2 md:mb-8 px-4 md:space-y-5 md:px-0">
          {subPosts.map((post) => (
            <div
              className="group/sub flex flex-col gap-3 border-t border-border pt-4 md:grid md:grid-cols-[minmax(0,140px)_1fr] md:gap-3 md:border-t-0 md:pt-0"
              key={post.id}
            >
              <div className="min-w-0 md:col-start-2 md:row-start-1">
                <Link className="block" href={`/posts/${post?.slug}`}>
                  <h4
                    className={cn(
                      'font-serif text-base font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover/sub:underline',
                      accentHover.sub,
                    )}
                  >
                    {post.title}
                  </h4>
                </Link>
              </div>
              <div className="flow-root min-w-0 md:contents">
                <Link
                  className={cn(
                    'relative float-right mb-1 ml-3 size-[90px] shrink-0 overflow-hidden rounded-lg',
                    'md:float-none md:col-start-1 md:row-start-1 md:row-span-2 md:mb-0 md:ml-0 md:size-auto md:max-w-[140px] md:aspect-4/3 md:w-full md:self-start md:rounded-none',
                  )}
                  href={`/posts/${post?.slug}`}
                >
                  {typeof post.meta?.image === 'object' && post.meta?.image && (
                    <MediaComponent
                      className="relative block size-full min-h-0"
                      fill
                      pictureClassName="block size-full min-h-0"
                      imgClassName="object-cover transition-transform duration-300 ease-out group-hover/sub:scale-105"
                      resource={post.meta.image}
                      size="(max-width: 767px) 90px, 140px"
                    />
                  )}
                </Link>
                <div className="min-w-0 [&>p]:mt-0 md:col-start-2 md:row-start-2 md:[&>p]:mt-2">
                  <PostExcerpt post={post} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {footerPosts.length > 0 && (
        <div className="flex flex-col divide-y divide-border border-t border-border bg-background mx-4 md:grid md:grid-cols-2 md:divide-y-0 md:border-t-0 md:bg-transparent md:gap-x-4 md:gap-y-3 md:mx-0 lg:grid-cols-3">
          {footerPosts.map((post) => (
            <Link
              className={cn(
                'flex items-start gap-3 py-3 font-serif text-sm font-bold leading-snug text-foreground md:gap-2 md:py-0 md:font-semibold md:underline-offset-2 md:hover:underline',
                'transition-colors duration-200',
                accentHover.link,
              )}
              href={`/posts/${post?.slug}`}
              key={post.id}
            >
              <span
                aria-hidden
                className="mt-1 h-2 w-2 shrink-0 rounded-none md:hidden"
                style={{ backgroundColor: palette.bar }}
              />
              <span
                aria-hidden
                className="mt-1.5 hidden h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50 md:block"
              />
              <span className="font-serif">{post.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
