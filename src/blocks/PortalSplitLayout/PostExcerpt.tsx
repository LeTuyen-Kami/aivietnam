import type { Post } from '@/payload-types'
import { cn } from '@/utilities/ui'

export function PostExcerpt({ post, className }: { post: Post; className?: string }) {
  const text = post.meta?.description

  if (!text) {
    return null
  }

  return (
    <p className={cn('mt-2 line-clamp-4 text-base text-muted-foreground font-arial', className)}>
      {text}
    </p>
  )
}
