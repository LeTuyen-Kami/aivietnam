'use client'

import React, { useEffect, useState } from 'react'

import type { Post } from '@/payload-types'

import { SmartLink } from '@/components/SmartLink'
import { cn } from '@/utilities/ui'

const PAGE_SIZE = 5

export const HumanitarianArticlesList: React.FC<{
  posts: Post[]
}> = ({ posts }) => {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, posts.length))
  const postsKey = posts.map((p) => p.id).join(',')

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, posts.length))
  }, [posts.length, postsKey])

  if (posts.length === 0) {
    return null
  }

  const visible = posts.slice(0, visibleCount)
  const canShowMore = visibleCount < posts.length

  return (
    <div className="mx-4 md:mx-0 block md:hidden border-r-0">
      <div className="bg-white">
        <ul className="border-b border-neutral-200 pb-2">
          {visible.map((post) => {
            const slug = typeof post.slug === 'string' ? post.slug : ''
            if (!slug) {
              return null
            }
            const href = `/posts/${slug}`
            return (
              <li key={post.id}>
                <SmartLink className={cn('text-base line-clamp-2')} href={href}>
                  {post.title}
                </SmartLink>
              </li>
            )
          })}
        </ul>
        {canShowMore ? (
          <div className="border-t border-neutral-200 bg-white px-0 py-3">
            <button
              className="w-full py-2 text-center font-sans text-sm font-medium text-neutral-800 transition-colors hover:text-black"
              type="button"
              onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, posts.length))}
            >
              Xem thêm
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
