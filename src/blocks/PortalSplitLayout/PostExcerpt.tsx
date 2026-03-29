import type { Post } from '@/payload-types'

export function PostExcerpt({ post }: { post: Post }) {
  const text = post.meta?.description

  if (!text) {
    return null
  }

  return <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{text}</p>
}
