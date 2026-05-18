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
        <ul>
          {visible.map((post) => {
            const slug = typeof post.slug === 'string' ? post.slug : ''
            if (!slug) {
              return null
            }
            const href = `/posts/${slug}`
            return (
              <li className="border-b border-neutral-200 last:border-b-0" key={post.id}>
                <SmartLink
                  className={cn(
                    'block py-3 font-serif text-base leading-snug text-foreground line-clamp-2',
                  )}
                  href={href}
                >
                  {post.title}
                </SmartLink>
              </li>
            )
          })}
        </ul>
        {canShowMore ? (
          <div className="flex justify-center bg-white pt-5 pb-1">
            <button
              className="rounded px-8 py-2.5 font-serif text-sm uppercase tracking-wide text-white transition-colors bg-[#bcbcbc] hover:bg-[#a8a8a8]"
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
