'use client'

import { useEffect } from 'react'

import { Eye } from 'lucide-react'

interface ViewCounterProps {
  postId: string
  initialViews: number
}

export function ViewCounter({ postId, initialViews }: ViewCounterProps) {
  useEffect(() => {
    // Gọi API để tăng lượt view sau khi trang load
    const incrementViews = async () => {
      try {
        await fetch(`/api/posts/${postId}/increment-views`, {
          method: 'POST',
        })
      } catch (error) {
        // Không cần xử lý lỗi, chỉ là thống kê
        console.error('Failed to increment views:', error)
      }
    }

    incrementViews()
  }, [postId])

  // Format số views: 1.2K, 1.5M, v.v.
  const formatViews = (count: number): string => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
      title={`${initialViews} lượt xem`}
    >
      <Eye aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span>{formatViews(initialViews)} lượt xem</span>
    </span>
  )
}
