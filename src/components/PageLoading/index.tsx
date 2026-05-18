import { cn } from '@/utilities/ui'
import { Loader2 } from 'lucide-react'

function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function PageLoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      aria-label="Đang tải"
      aria-live="polite"
      className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4', className)}
      role="status"
    >
      <Loader2 aria-hidden className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Đang tải…</p>
    </div>
  )
}

export function ArticlePageLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải bài viết" className="pb-16" role="status">
      <div className="container min-w-0 px-4 pt-6 sm:px-6 sm:pt-8 lg:pt-14">
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-w-0 space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full max-w-2xl" />
            <Skeleton className="h-8 w-4/5 max-w-xl" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-2 aspect-[16/9] w-full" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="hidden space-y-4 lg:block">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="flex gap-3" key={i}>
                <Skeleton className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MediaItemPageLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải media" className="pb-20" role="status">
      <section className="border-b border-border bg-[#f7f3ec]">
        <div className="container space-y-6 px-4 py-8 md:px-0 md:py-10">
          <Skeleton className="h-4 w-28" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,760px)_1fr]">
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-12 w-full max-w-3xl" />
              <Skeleton className="h-5 w-2/3 max-w-xl" />
            </div>
            <Skeleton className="aspect-video w-full lg:aspect-[4/3]" />
          </div>
        </div>
      </section>
      <article className="container space-y-4 px-4 pt-8 md:px-0 md:pt-10">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </article>
    </div>
  )
}

export function ListingPageLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải tin rao" className="py-8" role="status">
      <div className="container min-w-0 overflow-hidden rounded-none border border-border bg-background shadow-lg sm:rounded-lg">
        <Skeleton className="aspect-[4/3] w-full rounded-none sm:aspect-[16/9]" />
        <div className="space-y-4 p-4 sm:p-6">
          <Skeleton className="h-7 w-3/4 max-w-lg" />
          <Skeleton className="h-5 w-1/3 max-w-xs" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ListPageLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh sách" className="pb-16" role="status">
      <div className="container space-y-8 px-4 py-10 md:px-0">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="space-y-3" key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
