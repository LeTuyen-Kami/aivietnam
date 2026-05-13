'use client'

import { Plus, Send, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

type ProvinceOption = {
  code: number
  name: string
}

type WardOption = {
  code: number
  name: string
  province_code: number
}

import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/ui'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

type CategoryOption = {
  id: number
  title: string
}

type Props = {
  buttonLabel: string
  categories: CategoryOption[]
  modalDescription?: string
  modalTitle: string
  successMessage?: string
}

type ListingType = 'job-seeking' | 'job-offer' | 'service' | 'other'

const VIETNAM_DIVISIONS_API_BASE = '/api/v2'

const listingTypeOptions: Array<{ label: string; value: ListingType }> = [
  { label: 'Cần việc', value: 'job-seeking' },
  { label: 'Tuyển dụng', value: 'job-offer' },
  { label: 'Dịch vụ', value: 'service' },
  { label: 'Khác', value: 'other' },
]

const initialForm = {
  title: '',
  listingType: 'job-seeking' as ListingType,
  categoryId: '',
  priceLabel: 'Thỏa thuận',
  summary: '',
  description: '',
  city: '',
  district: '',
  provinceCode: '',
  wardCode: '',
  address: '',
  contactName: '',
  contactPhone: '',
  supportPhone: '',
  zaloUrl: '',
}

export function ListingCreateClient({
  buttonLabel,
  categories,
  modalDescription,
  modalTitle,
  successMessage,
}: Props) {
  const titleId = useId()
  const descriptionId = useId()
  const shouldReduceMotion = useReducedMotion()
  const { loading, openAuthModal, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [wards, setWards] = useState<WardOption[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const firstCategory = categories[0]?.id
  const categoryValue = form.categoryId || (firstCategory ? String(firstCategory) : '')
  const provinceValue = form.provinceCode
  const wardValue = form.wardCode

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    let cancelled = false

    const loadProvinces = async () => {
      setLoadingProvinces(true)
      setLocationError(null)

      try {
        const response = await fetch(`${VIETNAM_DIVISIONS_API_BASE}/p/`, {
          credentials: 'omit',
        })
        if (!response.ok) throw new Error('Không tải được danh sách tỉnh / thành')

        const data = (await response.json()) as Array<{ code: number; name: string }>
        if (cancelled) return

        setProvinces(data.map((item) => ({ code: item.code, name: item.name })))
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : 'Không tải được danh sách tỉnh / thành'
        setLocationError(message)
        setProvinces([])
      } finally {
        if (!cancelled) setLoadingProvinces(false)
      }
    }

    void loadProvinces()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!provinceValue) {
      setWards([])
      setLoadingWards(false)
      return
    }

    let cancelled = false

    const loadWards = async () => {
      setLoadingWards(true)
      setLocationError(null)

      try {
        const response = await fetch(
          `${VIETNAM_DIVISIONS_API_BASE}/w/?province=${encodeURIComponent(provinceValue)}`,
          {
            credentials: 'omit',
          },
        )
        if (!response.ok) throw new Error('Không tải được danh sách xã / phường')

        const data = (await response.json()) as Array<{
          code: number
          name: string
          province_code: number
        }>
        if (cancelled) return

        setWards(
          data.map((item) => ({
            code: item.code,
            name: item.name,
            province_code: item.province_code,
          })),
        )
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : 'Không tải được danh sách xã / phường'
        setLocationError(message)
        setWards([])
      } finally {
        if (!cancelled) setLoadingWards(false)
      }
    }

    void loadWards()

    return () => {
      cancelled = true
    }
  }, [provinceValue])

  const descriptionText = useMemo(
    () =>
      modalDescription?.trim() ||
      'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
    [modalDescription],
  )

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateProvince(provinceCode: string) {
    const province = provinces.find((item) => String(item.code) === provinceCode)

    setForm((current) => ({
      ...current,
      provinceCode,
      wardCode: '',
      city: province?.name ?? '',
      district: '',
    }))
  }

  function updateWard(wardCode: string) {
    const ward = wards.find((item) => String(item.code) === wardCode)

    setForm((current) => ({
      ...current,
      wardCode,
      district: ward?.name ?? '',
    }))
  }

  function openComposer() {
    if (!loading && !user) {
      openAuthModal()
      return
    }
    setError(null)
    setDone(false)
    setOpen(true)
  }

  async function submitListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setDone(false)
    setPending(true)

    try {
      const response = await fetch('/api/listings/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          categoryId: categoryValue,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        const message = data.error || 'Không gửi được tin đăng'
        setError(message)
        toast.error(message)
        return
      }

      toast.success(successMessage || 'Đã gửi tin đăng. Admin sẽ duyệt trước khi tin xuất hiện.')
      setDone(true)
      setForm(initialForm)
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  const portal =
    mounted &&
    createPortal(
      <>
        <motion.button
          aria-label={buttonLabel}
          className="fixed bottom-5 right-5 z-[70] inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(29,155,240,0.35)] transition-colors hover:bg-[#1686d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d9bf0] active:scale-[0.97] md:bottom-8 md:right-8 cursor-pointer"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={openComposer}
          type="button"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{buttonLabel}</span>
        </motion.button>

        <AnimatePresence>
          {open ? (
            <div
              aria-describedby={descriptionId}
              aria-labelledby={titleId}
              aria-modal="true"
              className="fixed inset-0 z-[80]"
              role="dialog"
            >
              <motion.button
                aria-label="Đóng modal đăng tin"
                className="absolute inset-0 h-full w-full bg-black/45"
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                onClick={() => setOpen(false)}
                type="button"
              />

              <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
                <motion.div
                  className="pointer-events-auto max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:max-w-2xl sm:rounded-2xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 24 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 18 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                    <div>
                      <h2 className="text-xl font-bold leading-tight" id={titleId}>
                        {modalTitle}
                      </h2>
                      <p
                        className="mt-1 text-sm leading-6 text-muted-foreground"
                        id={descriptionId}
                      >
                        {descriptionText}
                      </p>
                    </div>
                    <button
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Đóng</span>
                    </button>
                  </div>

                  <form
                    id="listing-create-form"
                    className="max-h-[calc(92vh-112px)] overflow-y-auto p-5"
                    onSubmit={submitListing}
                  >
                    {error ? (
                      <div className="mb-5 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {error}
                      </div>
                    ) : null}
                    {locationError ? (
                      <div className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {locationError}
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2 pb-15">
                      <Field label="Tiêu đề" required>
                        <input
                          className={inputClassName}
                          maxLength={140}
                          onChange={(event) => updateField('title', event.currentTarget.value)}
                          required
                          value={form.title}
                          placeholder="Vui lòng nhập tiêu đề"
                        />
                      </Field>
                      <Field label="Loại tin">
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            updateField('listingType', event.currentTarget.value as ListingType)
                          }
                          value={form.listingType}
                        >
                          {listingTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Danh mục">
                        <select
                          className={inputClassName}
                          disabled={!categories.length}
                          onChange={(event) => updateField('categoryId', event.currentTarget.value)}
                          value={categoryValue}
                        >
                          {categories.length ? (
                            categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.title}
                              </option>
                            ))
                          ) : (
                            <option value="">Chưa có danh mục</option>
                          )}
                        </select>
                      </Field>
                      <Field label="Giá / ngân sách" required>
                        <input
                          className={inputClassName}
                          maxLength={80}
                          onChange={(event) => updateField('priceLabel', event.currentTarget.value)}
                          placeholder="Ví dụ: 10 triệu / Thỏa thuận"
                          required
                          value={form.priceLabel}
                        />
                      </Field>
                      <Field label="Tỉnh / thành" required>
                        <select
                          className={inputClassName}
                          disabled={loadingProvinces || !provinces.length}
                          onChange={(event) => updateProvince(event.currentTarget.value)}
                          required
                          value={provinceValue}
                        >
                          <option value="">
                            {loadingProvinces ? 'Đang tải tỉnh / thành...' : 'Chọn tỉnh / thành'}
                          </option>
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Xã / phường" required>
                        <select
                          className={inputClassName}
                          disabled={!provinceValue || loadingWards || !wards.length}
                          onChange={(event) => updateWard(event.currentTarget.value)}
                          required
                          value={wardValue}
                        >
                          <option value="">
                            {!provinceValue
                              ? 'Chọn tỉnh / thành trước'
                              : loadingWards
                                ? 'Đang tải xã / phường...'
                                : 'Chọn xã / phường'}
                          </option>
                          {wards.map((ward) => (
                            <option key={ward.code} value={ward.code}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field className="md:col-span-2" label="Địa chỉ">
                        <input
                          className={inputClassName}
                          onChange={(event) => updateField('address', event.currentTarget.value)}
                          placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                          value={form.address}
                        />
                      </Field>
                      <Field className="md:col-span-2" label="Mô tả ngắn">
                        <textarea
                          className={cn(inputClassName, 'min-h-20 resize-y py-3')}
                          maxLength={260}
                          onChange={(event) => updateField('summary', event.currentTarget.value)}
                          placeholder="Mô tả ngắn gọn nội dung tin đăng"
                          value={form.summary}
                        />
                      </Field>
                      <Field className="md:col-span-2" label="Nội dung mô tả" required>
                        <textarea
                          className={cn(inputClassName, 'min-h-32 resize-y py-3')}
                          onChange={(event) =>
                            updateField('description', event.currentTarget.value)
                          }
                          placeholder="Nhập chi tiết công việc, dịch vụ hoặc nhu cầu của bạn"
                          required
                          value={form.description}
                        />
                      </Field>
                      <Field label="Tên liên hệ" required>
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateField('contactName', event.currentTarget.value)
                          }
                          placeholder="Ví dụ: Nguyễn Văn A"
                          required
                          value={form.contactName}
                        />
                      </Field>
                      <Field label="Số điện thoại" required>
                        <input
                          className={inputClassName}
                          inputMode="tel"
                          onChange={(event) =>
                            updateField('contactPhone', event.currentTarget.value)
                          }
                          placeholder="Ví dụ: 0901234567"
                          required
                          value={form.contactPhone}
                        />
                      </Field>
                      <Field label="SĐT hỗ trợ">
                        <input
                          className={inputClassName}
                          inputMode="tel"
                          onChange={(event) =>
                            updateField('supportPhone', event.currentTarget.value)
                          }
                          placeholder="Ví dụ: 0912345678"
                          value={form.supportPhone}
                        />
                      </Field>
                      <Field label="Zalo URL">
                        <input
                          className={inputClassName}
                          onChange={(event) => updateField('zaloUrl', event.currentTarget.value)}
                          placeholder="https://zalo.me/..."
                          value={form.zaloUrl}
                        />
                      </Field>
                    </div>
                  </form>
                  <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-3 border-t border-border bg-background px-5 py-4">
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98]"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      Hủy
                    </button>
                    <button
                      form="listing-create-form"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1686d9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={pending}
                      type="submit"
                    >
                      <Send className="h-4 w-4" />
                      {pending ? 'Đang gửi...' : 'Gửi duyệt'}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
      </>,
      document.body,
    )

  return portal || null
}

const inputClassName =
  'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/50'

function Field({
  children,
  className,
  label,
  required,
}: {
  children: React.ReactNode
  className?: string
  label: string
  required?: boolean
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-semibold text-foreground', className)}>
      <span>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
