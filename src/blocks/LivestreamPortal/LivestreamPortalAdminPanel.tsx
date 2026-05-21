'use client'

import { ImagePlus, Loader2, Trash2, WandSparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { slugifyTitle } from '@/utilities/slugify'

type Props = {
  heading: string
  description?: string | null
}

type CreateResponse = {
  slug?: string
  error?: string
}

type UploadedCover = {
  alt?: string | null
  id: number
  mimeType?: string | null
  url?: string | null
}

const MAX_COVER_SIZE = 10 * 1024 * 1024
const ACCEPTED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

function generateRandomLivestreamSlug(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `live-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
  }

  return `live-${Math.random().toString(36).slice(2, 12)}`
}

function getCoverUploadError(file: File): string | null {
  if (!ACCEPTED_COVER_TYPES.includes(file.type as (typeof ACCEPTED_COVER_TYPES)[number])) {
    return 'Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF'
  }

  if (file.size > MAX_COVER_SIZE) {
    return 'Ảnh tối đa 10MB'
  }

  return null
}

function CoverPreview({ cover, onRemove }: { cover: UploadedCover; onRemove: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20">
      {cover.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={cover.alt || 'Ảnh cover livestream'}
          className="aspect-video w-full object-cover"
          src={cover.url}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center text-xs text-muted-foreground">
          Không xem trước được ảnh
        </div>
      )}
      <button
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition-opacity hover:opacity-90"
        onClick={onRemove}
        type="button"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        <span className="sr-only">Xóa ảnh cover</span>
      </button>
    </div>
  )
}

export function LivestreamPortalAdminPanel({ heading, description }: Props) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [buttonY, setButtonY] = useState(0)
  const [scrollOffsetY, setScrollOffsetY] = useState(0)
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 })
  const [isDraggingButton, setIsDraggingButton] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dragStateRef = useRef<{ pointerId: number | null; startY: number; originY: number }>({
    pointerId: null,
    startY: 0,
    originY: 0,
  })
  const scrollParallaxRef = useRef({ current: 0, target: 0, animationFrame: 0 })
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState(generateRandomLivestreamSlug)
  const [descriptionValue, setDescriptionValue] = useState('')
  const [selectedCover, setSelectedCover] = useState<UploadedCover | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedSlug = useMemo(() => slugifyTitle(title) ?? '', [title])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return

    const updateButtonBounds = () => {
      const viewportHeight = window.innerHeight
      const defaultTop = Math.round(viewportHeight * 0.25 - 28)
      const minY = 16
      const maxY = Math.max(16, viewportHeight - 72)

      setButtonY((current) => {
        if (current === 0) {
          return Math.min(Math.max(defaultTop, minY), maxY)
        }

        return Math.min(Math.max(current, minY), maxY)
      })
    }

    let previousScrollY = window.scrollY

    const animateScrollParallax = () => {
      const state = scrollParallaxRef.current

      state.target *= 0.82
      state.current += (state.target - state.current) * 0.18

      if (Math.abs(state.current) < 0.05 && Math.abs(state.target) < 0.05) {
        state.current = 0
        state.target = 0
        state.animationFrame = 0
        setScrollOffsetY(0)
        return
      }

      setScrollOffsetY(state.current)
      state.animationFrame = window.requestAnimationFrame(animateScrollParallax)
    }

    const handleScroll = () => {
      const nextScrollY = window.scrollY
      const delta = nextScrollY - previousScrollY
      previousScrollY = nextScrollY

      const state = scrollParallaxRef.current
      state.target = Math.max(-18, Math.min(18, delta * -1))

      if (!state.animationFrame) {
        state.animationFrame = window.requestAnimationFrame(animateScrollParallax)
      }
    }

    updateButtonBounds()
    window.addEventListener('resize', updateButtonBounds)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateButtonBounds)
      window.removeEventListener('scroll', handleScroll)
      const state = scrollParallaxRef.current
      if (state.animationFrame) {
        window.cancelAnimationFrame(state.animationFrame)
        state.animationFrame = 0
      }
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return

    const magneticRadius = 160
    const magneticStrength = 0.18
    const maxOffset = 16

    const handlePointerMove = (event: PointerEvent) => {
      if (isDraggingButton || !buttonRef.current || event.pointerType === 'touch') return

      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = event.clientX - centerX
      const deltaY = event.clientY - centerY
      const distance = Math.hypot(deltaX, deltaY)

      if (distance >= magneticRadius) {
        setMagneticOffset((current) =>
          Math.abs(current.x) < 0.5 && Math.abs(current.y) < 0.5 ? current : { x: 0, y: 0 },
        )
        return
      }

      const easedFalloff = Math.pow(1 - distance / magneticRadius, 1.6)
      setMagneticOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX * magneticStrength * easedFalloff)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY * magneticStrength * easedFalloff)),
      })
    }

    const resetMagneticOffset = () => {
      setMagneticOffset({ x: 0, y: 0 })
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', resetMagneticOffset)
    window.addEventListener('pointercancel', resetMagneticOffset)
    window.addEventListener('blur', resetMagneticOffset)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', resetMagneticOffset)
      window.removeEventListener('pointercancel', resetMagneticOffset)
      window.removeEventListener('blur', resetMagneticOffset)
    }
  }, [isDraggingButton, isMounted])

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

  const uploadCover = async (file: File) => {
    const uploadError = getCoverUploadError(file)
    if (uploadError) throw new Error(uploadError)

    const body = new FormData()
    body.append('file', file, file.name?.trim() || `cover-${Date.now()}`)
    body.append('alt', file.name.replace(/\.[^.]+$/, '') || title.trim() || 'Livestream cover')

    const response = await fetch('/api/livestreams/media', {
      method: 'POST',
      credentials: 'include',
      body,
    })

    const data = (await response.json().catch(() => ({}))) as {
      error?: string
      doc?: UploadedCover
    }

    if (!response.ok || !data.doc) {
      throw new Error(data.error ?? 'Không tải được ảnh cover')
    }

    return data.doc
  }

  const handleCoverFileChange = async (file: File | null) => {
    if (!file) return

    setUploadingCover(true)
    setError(null)
    try {
      const uploaded = await uploadCover(file)
      setSelectedCover(uploaded)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không tải được ảnh cover')
    } finally {
      setUploadingCover(false)
    }
  }

  const resetCreateForm = () => {
    setTitle('')
    setSlug(generateRandomLivestreamSlug())
    setDescriptionValue('')
    setSelectedCover(null)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const rawSlug = slug.trim() || generateRandomLivestreamSlug()
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
          coverImage: selectedCover?.id ?? null,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as CreateResponse
      if (!response.ok || !body.slug) {
        throw new Error(
          body.error ??
            (response.status >= 500
              ? 'Lỗi máy chủ khi tạo phòng. Thử lại hoặc đổi slug.'
              : 'Không thể tạo livestream'),
        )
      }

      setIsOpen(false)
      resetCreateForm()
      router.push(`/broadcaster/${encodeURIComponent(body.slug)}`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo livestream')
    } finally {
      setIsSubmitting(false)
    }
  }

  const minButtonY = 16
  const maxButtonY = typeof window === 'undefined' ? 16 : Math.max(16, window.innerHeight - 72)

  const handleButtonPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      originY: buttonY,
    }
    setIsDraggingButton(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleButtonPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return

    const deltaY = event.clientY - dragStateRef.current.startY
    if (!isDraggingButton && Math.abs(deltaY) > 4) {
      setIsDraggingButton(true)
    }

    setButtonY(Math.min(Math.max(dragStateRef.current.originY + deltaY, minButtonY), maxButtonY))
  }

  const handleButtonPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return

    dragStateRef.current = {
      pointerId: null,
      startY: 0,
      originY: 0,
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setMagneticOffset({ x: 0, y: 0 })
  }

  const handleOpenButtonClick = () => {
    if (isDraggingButton) {
      setIsDraggingButton(false)
      return
    }

    resetCreateForm()
    setIsOpen(true)
  }

  const floatingButton = isMounted
    ? createPortal(
        <Button
          ref={buttonRef}
          aria-controls="livestream-admin-panel-modal"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="fixed right-6 z-[10000] h-14 w-14 rounded-full shadow-xl shadow-black/20 hover:scale-105 hover:cursor-pointer active:scale-95 touch-none"
          onClick={handleOpenButtonClick}
          onPointerDown={handleButtonPointerDown}
          onPointerMove={handleButtonPointerMove}
          onPointerUp={handleButtonPointerEnd}
          onPointerCancel={handleButtonPointerEnd}
          size="icon"
          style={{
            top: buttonY,
            transform: `translate3d(${magneticOffset.x}px, ${scrollOffsetY + magneticOffset.y}px, 0)`,
          }}
          type="button"
        >
          <WandSparkles className="h-6 w-6" aria-hidden />
          <span className="sr-only">Mở quản lý livestream</span>
        </Button>,
        document.body,
      )
    : null

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
                      {description || 'Tạo phòng mới và chuyển nhanh sang màn hình phát sóng.'}
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

                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                  <Card className="mx-auto max-w-2xl border-border/80 shadow-lg shadow-black/5">
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
                            onChange={(event) => setTitle(event.target.value)}
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
                            Có thể trùng tiêu đề; slug phải khác nhau. Để trống hoặc giữ slug ngẫu nhiên
                            mặc định. Gợi ý từ tiêu đề:{' '}
                            <span className="font-medium text-foreground">
                              {suggestedSlug || '—'}
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

                        <div className="space-y-3">
                          <span className="text-sm font-medium">Ảnh cover</span>
                          <p className="text-xs text-muted-foreground">
                            Tải ảnh cover cho phòng livestream. Không bắt buộc.
                          </p>

                          {selectedCover ? (
                            <CoverPreview
                              cover={selectedCover}
                              onRemove={() => setSelectedCover(null)}
                            />
                          ) : null}

                          <label className="grid gap-2 text-sm font-medium text-foreground">
                            <span className="sr-only">Tải ảnh cover</span>
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 sm:p-4">
                              <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                                {uploadingCover ? (
                                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                ) : (
                                  <ImagePlus className="h-5 w-5" aria-hidden />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {uploadingCover ? 'Đang tải ảnh…' : 'Chọn ảnh từ thiết bị'}
                                  </p>
                                  <p className="text-xs leading-5">
                                    JPG, PNG, WEBP hoặc GIF — tối đa 10MB. Khuyến nghị tỷ lệ 16:9.
                                  </p>
                                </div>
                              </div>
                              <input
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="mt-3 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90"
                                disabled={uploadingCover}
                                onChange={(event) => {
                                  void handleCoverFileChange(event.currentTarget.files?.[0] ?? null)
                                  event.currentTarget.value = ''
                                }}
                                type="file"
                              />
                            </div>
                          </label>
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
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {modalContent}
      {floatingButton}
    </>
  )
}
