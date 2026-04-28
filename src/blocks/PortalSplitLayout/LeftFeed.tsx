import Link from 'next/link'

import type { Post } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { PostExcerpt } from './PostExcerpt'

export function LeftFeed({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return null
  }

  return (
    <div className="space-y-10">
      {posts.map((post) => (
        <article className="last:pb-0" key={post.id}>
          <Link className="group block" href={`/posts/${post.slug}`}>
            {typeof post.meta?.image === 'object' && post.meta.image && (
              <MediaComponent
                className="mb-3 overflow-hidden"
                imgClassName="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                resource={post.meta.image}
                size="(max-width: 1024px) 100vw, 33vw"
              />
            )}
            <h3 className="font-serif text-lg font-bold leading-snug text-foreground transition-colors duration-200 underline-offset-2 group-hover:underline">
              {post.title}
            </h3>
            <PostExcerpt post={post} />
          </Link>
        </article>
      ))}
    </div>
  )
}
