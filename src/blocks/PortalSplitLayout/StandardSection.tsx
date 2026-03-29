import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { accentHover, accentTextVarStyle, getAccentStyle } from './accent'
import { PostExcerpt } from './PostExcerpt'
import type { SectionAccent } from './types'
import { cn } from '@/utilities/ui'

export function StandardSection({
  accent,
  featuredPost,
  footerPosts,
  sectionTitle,
  subPosts,
}: {
  accent: SectionAccent
  featuredPost: Post | null
  footerPosts: Post[]
  sectionTitle: string
  subPosts: Post[]
}) {
  const palette = getAccentStyle(accent)

  if (!featuredPost) {
    return null
  }

  return (
    <section
      className="border-t border-border/40 pt-10 first:border-t-0 first:pt-0"
      style={accentTextVarStyle(palette.text)}
    >
      <div className="mb-4 h-1 w-full rounded-sm" style={{ backgroundColor: palette.bar }} />
      <h2 className="mb-6 font-serif text-xl font-bold text-foreground">{sectionTitle}</h2>

      <div className="group/feat mb-8 grid gap-4 md:grid-cols-2 md:gap-6">
        <Link className="block overflow-hidden md:col-span-1" href={`/posts/${featuredPost.slug}`}>
          {typeof featuredPost.meta?.image === 'object' && featuredPost.meta?.image && (
            <MediaComponent
              className="mb-0 overflow-hidden"
              imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover/feat:scale-105"
              resource={featuredPost.meta.image}
              size="(max-width: 768px) 100vw, 40vw"
            />
          )}
        </Link>
        <div className="flex flex-col justify-start">
          <Link className="block" href={`/posts/${featuredPost.slug}`}>
            <h3
              className={cn(
                'font-serif text-xl font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover/feat:underline',
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
        <div className="mb-8 space-y-5">
          {subPosts.map((post) => (
            <div
              className="group/sub grid grid-cols-[minmax(0,120px)_1fr] gap-3 sm:grid-cols-[minmax(0,140px)_1fr]"
              key={post.id}
            >
              <Link className="block shrink-0 overflow-hidden" href={`/posts/${post.slug}`}>
                {typeof post.meta?.image === 'object' && post.meta?.image && (
                  <MediaComponent
                    className="h-full w-full"
                    imgClassName="aspect-[4/3] w-full object-cover transition-transform duration-300 ease-out group-hover/sub:scale-105"
                    resource={post.meta.image}
                    size="140px"
                  />
                )}
              </Link>
              <div>
                <Link className="block" href={`/posts/${post.slug}`}>
                  <h4
                    className={cn(
                      'font-serif text-base font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover/sub:underline',
                      accentHover.sub,
                    )}
                  >
                    {post.title}
                  </h4>
                </Link>
                <PostExcerpt post={post} />
              </div>
            </div>
          ))}
        </div>
      )}

      {footerPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {footerPosts.map((post) => (
            <Link
              className={cn(
                'flex gap-2 text-sm font-semibold leading-snug text-foreground transition-colors duration-200 underline-offset-2 hover:underline',
                accentHover.link,
              )}
              href={`/posts/${post.slug}`}
              key={post.id}
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
              />
              <span className="font-serif">{post.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
