'use client'

import { CalendarDays, ExternalLink, Loader2, Radio, Video, WandSparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Livestream, Media as MediaType } from '@/payload-types'
import { slugifyTitle } from '@/utilities/slugify'
import { cn } from '@/utilities/ui'

type LivestreamWithCover = Livestream & {
  coverImage?: MediaType | number | null
}

type Props = {
  heading: string
  description?: string | null
  livestreams: LivestreamWithCover[]
}

type CreateResponse = {
  slug?: string
  error?: string
}

function statusLabel(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'Đang phát'
    case 'scheduled':
      return 'Đã lên lịch'
    case 'draft':
      return 'Bản nháp'
    case 'ended':
      return 'Đã kết thúc'
    default:
      return status
  }
}

function statusClass(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300'
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300'
    case 'draft':
      return 'bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-200'
    case 'ended':
      return 'bg-muted text-muted-foreground ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-border'
  }
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function LivestreamPortalAdminPanel({ heading, description, livestreams }: Props) {
  const coverOptions = livestreams
    .map((livestream) =>
      typeof livestream.coverImage === 'object' && livestream.coverImage
        ? livestream.coverImage
        : null,
    )
    .filter((media, index, array): media is MediaType => {
      if (!media) return false
      return array.findIndex((item) => item?.id === media.id) === index
    })

  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedSlug = useMemo(() => slugifyTitle(title) ?? '', [title])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setSlug((current) => {
      if (current.trim().length > 0) return current
      return slugifyTitle(value) ?? ''
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const rawSlug = slug.trim() || suggestedSlug
    const normalizedSlug = slugifyTitle(rawSlug) ?? ''

    if (!trimmedTitle) {
      setError('Tiêu đề là bắt buộc.')
      return
    }

    if (!normalizedSlug) {
      setError('Slug chưa hợp lệ.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/livestreams/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: trimmedTitle,
          slug: normalizedSlug,
          description: descriptionValue.trim() || null,
          scheduledAt: scheduledAt || null,
          coverImage: coverImage || null,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as CreateResponse
      if (!response.ok || !body.slug) {
        throw new Error(body.error ?? 'Không thể tạo livestream')
      }

      setIsOpen(false)
      router.push(`/broadcaster/${encodeURIComponent(body.slug)}`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo livestream')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent =
    isMounted && isOpen
      ? createPortal(
          <div className="fixed inset-0 z-[9999]">
            <button
              aria-label="Đóng modal quản lý livestream"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              type="button"
            />

            <div className="absolute inset-x-4 bottom-4 top-4 mx-auto flex max-w-7xl items-center justify-center">
              <div
                aria-describedby="livestream-admin-panel-description"
                aria-labelledby="livestream-admin-panel-title"
                aria-modal="true"
                className="flex max-h-full w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl"
                id="livestream-admin-panel-modal"
                role="dialog"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
                  <div className="space-y-1">
                    <h2
                      className="text-xl font-semibold tracking-tight"
                      id="livestream-admin-panel-title"
                    >
                      {heading}
                    </h2>
                    <p
                      className="text-sm text-muted-foreground"
                      id="livestream-admin-panel-description"
                    >
                      {description ||
                        'Tạo phòng mới, kiểm tra trạng thái và chuyển nhanh sang màn hình phát sóng.'}
                    </p>
                  </div>

                  <Button
                    className="shrink-0"
                    onClick={() => setIsOpen(false)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-5 w-5" aria-hidden />
                    <span className="sr-only">Đóng</span>
                  </Button>
                </div>

                <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 xl:grid-cols-[0.9fr_1.1fr] sm:p-6">
                  <Card className="border-border/80 shadow-lg shadow-black/5">
                    <CardHeader>
                      <CardTitle className="text-xl">Tạo phòng livestream</CardTitle>
                      <CardDescription>
                        Thiết lập thông tin cơ bản. Tạo xong sẽ chuyển sang route broadcaster.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="livestream-title">
                            Tiêu đề
                          </label>
                          <Input
                            id="livestream-title"
                            onChange={(event) => handleTitleChange(event.target.value)}
                            placeholder="Ví dụ: AI Weekly Live #12"
                            value={title}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="livestream-slug">
                            Slug
                          </label>
                          <Input
                            id="livestream-slug"
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="ai-weekly-live-12"
                            value={slug}
                          />
                          <p className="text-xs text-muted-foreground">
                            Gợi ý:{' '}
                            <span className="font-medium text-foreground">
                              {suggestedSlug || 'slug-tu-dong-tu-title'}
                            </span>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="livestream-description">
                            Mô tả
                          </label>
                          <Textarea
                            id="livestream-description"
                            onChange={(event) => setDescriptionValue(event.target.value)}
                            placeholder="Mô tả ngắn cho phiên livestream"
                            value={descriptionValue}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="livestream-scheduled-at">
                            Lịch phát
                          </label>
                          <Input
                            id="livestream-scheduled-at"
                            onChange={(event) => setScheduledAt(event.target.value)}
                            type="datetime-local"
                            value={scheduledAt}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium" htmlFor="livestream-cover-image">
                            Cover image
                          </label>
                          <Input
                            id="livestream-cover-image"
                            onChange={(event) => setCoverImage(event.target.value)}
                            placeholder="Nhập Media ID hoặc chọn nhanh từ danh sách bên dưới"
                            value={coverImage}
                          />
                          {coverOptions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {coverOptions.map((media) => {
                                const selected = coverImage === String(media.id)
                                return (
                                  <button
                                    className={cn(
                                      'overflow-hidden rounded-2xl border text-left transition-all',
                                      selected
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-border/70 hover:border-primary/40',
                                    )}
                                    key={media.id}
                                    onClick={() => setCoverImage(String(media.id))}
                                    type="button"
                                  >
                                    <div className="relative aspect-[4/5] bg-muted">
                                      <Media
                                        fill
                                        imgClassName="object-cover"
                                        pictureClassName="absolute inset-0"
                                        resource={media}
                                      />
                                    </div>
                                    <div className="px-3 py-2 text-xs text-muted-foreground">
                                      Media #{media.id}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Chưa có cover gợi ý. Bạn có thể nhập Media ID thủ công từ collection
                              Media.
                            </p>
                          )}
                        </div>

                        {error ? <p className="text-sm text-destructive">{error}</p> : null}

                        <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              Đang tạo phòng…
                            </>
                          ) : (
                            'Tạo và vào phòng phát'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="min-h-0 border-border/80 shadow-lg shadow-black/5">
                    <CardHeader>
                      <CardTitle className="text-xl">Danh sách phòng</CardTitle>
                      <CardDescription>
                        Chọn phòng có sẵn để mở broadcaster hoặc xem chi tiết.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {livestreams.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground">
                            Chưa có phòng livestream nào.
                          </div>
                        ) : (
                          livestreams.map((livestream) => {
                            const scheduled = formatDate(livestream.scheduledAt)
                            const updated = formatDate(livestream.updatedAt)
                            const broadcasterHref = `/broadcaster/${encodeURIComponent(livestream.slug)}`
                            const viewerHref = `/live/${encodeURIComponent(livestream.slug)}`
                            const coverMedia =
                              typeof livestream.coverImage === 'object' && livestream.coverImage
                                ? livestream.coverImage
                                : null

                            return (
                              <article
                                className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-sm transition-colors hover:bg-background"
                                key={livestream.id}
                              >
                                {coverMedia ? (
                                  <div className="relative aspect-[21/8] bg-muted">
                                    <Media
                                      fill
                                      imgClassName="object-cover"
                                      pictureClassName="absolute inset-0"
                                      resource={coverMedia}
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-transparent" />
                                  </div>
                                ) : null}

                                <div className="p-4">
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 space-y-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                                            statusClass(livestream.status),
                                          )}
                                        >
                                          <Radio className="h-3.5 w-3.5" aria-hidden />
                                          {statusLabel(livestream.status)}
                                        </span>
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                                          /{livestream.slug}
                                        </span>
                                      </div>

                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">
                                          {livestream.title}
                                        </h3>
                                        {livestream.description ? (
                                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {livestream.description}
                                          </p>
                                        ) : null}
                                      </div>

                                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {scheduled ? (
                                          <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                                            {scheduled}
                                          </span>
                                        ) : null}
                                        {updated ? <span>Cập nhật: {updated}</span> : null}
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col gap-2 sm:min-w-45">
                                      <SmartLink className="block" href={broadcasterHref}>
                                        <Button className="w-full" size="sm">
                                          <Video className="h-4 w-4" aria-hidden />
                                          Vào broadcaster
                                        </Button>
                                      </SmartLink>
                                      <SmartLink className="block" href={viewerHref}>
                                        <Button className="w-full" size="sm" variant="outline">
                                          Xem chi tiết
                                        </Button>
                                      </SmartLink>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <SmartLink
                                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                                      href={viewerHref}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                      Mở viewer route
                                    </SmartLink>
                                    <SmartLink
                                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                                      href={broadcasterHref}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                      Mở broadcaster route
                                    </SmartLink>
                                  </div>
                                </div>
                              </article>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <Button
        aria-controls="livestream-admin-panel-modal"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="fixed right-6 top-1/4 z-40 h-14 w-14 -translate-y-1/2 rounded-full shadow-xl shadow-black/20"
        onClick={() => setIsOpen(true)}
        size="icon"
        type="button"
      >
        <WandSparkles className="h-6 w-6" aria-hidden />
        <span className="sr-only">Mở quản lý livestream</span>
      </Button>

      {modalContent}
    </>
  )
}
