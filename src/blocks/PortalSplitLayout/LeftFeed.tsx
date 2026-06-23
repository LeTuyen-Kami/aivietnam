import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'
import { cn } from '@/utilities/ui'

import { PostExcerpt } from './PostExcerpt'

/**
 * Map cờ displayOn của bài viết sang class responsive Tailwind.
 * Mỗi breakpoint range được điều khiển độc lập:
 *  - mobile  (<768px)  → class không prefix
 *  - tablet  (>=768px) → md:
 *  - desktop (>=1024px)→ lg:
 * Thiếu cờ (bài cũ) coi như hiển thị mọi nơi.
 * Áp dụng cho MỌI bài ở cột trái (cả manual lẫn latest).
 */
function deviceVisibilityClass(post: Post): string {
  const mobile = post.displayOnMobile !== false
  const tablet = post.displayOnTablet !== false
  const desktop = post.displayOnDesktop !== false

  return cn(
    mobile ? 'block' : 'hidden',
    tablet ? 'md:block' : 'md:hidden',
    desktop ? 'lg:block' : 'lg:hidden',
  )
}

export function LeftFeed({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return null
  }

  return (
    <div className="md:space-y-10 space-y-4 px-4 md:px-0">
      {posts.map((post) => (
        <article
          className={cn(
            'border-t border-border pt-4 md:pt-0 md:border-none last:border-b last:border-border md:last:border-none last:pb-4 md:last:pb-0',
            deviceVisibilityClass(post),
          )}
          key={post.id}
        >
          <Link className="group  flex flex-col" href={`/posts/${post?.slug}`}>
            {typeof post.meta?.image === 'object' && post.meta.image && (
              <MediaComponent
                className="mb-3 overflow-hidden order-3 md:order-1 mt-4 md:mt-0"
                imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                resource={post.meta.image}
                size="(max-width: 1024px) 100vw, 33vw"
              />
            )}
            <h3 className="font-serif text-lg md:text-[15px] font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover:underline order-1 md:order-2">
              {post.title}
            </h3>
            <PostExcerpt post={post} className="order-2 md:order-3" />
          </Link>
        </article>
      ))}
    </div>
  )
}
