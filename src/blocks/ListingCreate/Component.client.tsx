'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { buildDefaultEditorState } from '@payloadcms/richtext-lexical/client'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type LexicalEditor,
} from 'lexical'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  Bold,
  Heading1,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Quote,
  Send,
  Trash2,
  Underline,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/ui'

type ProvinceOption = {
  code: number
  name: string
}

type WardOption = {
  code: number
  name: string
  province_code: number
}

type CategoryOption = {
  id: number
  title: string
}

type UploadedMedia = {
  alt?: string | null
  id: number
  mimeType?: string | null
  url?: string | null
}

type Props = {
  buttonLabel: string
  categories: CategoryOption[]
  modalDescription?: string
  modalTitle: string
  successMessage?: string
}

type ListingType = 'job-seeking' | 'job-offer' | 'service' | 'other'

type ListingCreateForm = {
  address: string
  categoryId: string
  city: string
  contactName: string
  contactPhone: string
  description: DefaultTypedEditorState
  district: string
  listingType: ListingType
  priceLabel: string
  provinceCode: string
  summary: string
  supportPhone: string
  title: string
  wardCode: string
  zaloUrl: string
}

const VIETNAM_DIVISIONS_API_BASE = '/api/v2'
const MAX_GALLERY_FILES = 8
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const listingTypeOptions: Array<{ label: string; value: ListingType }> = [
  { label: 'Cần việc', value: 'job-seeking' },
  { label: 'Tuyển dụng', value: 'job-offer' },
  { label: 'Dịch vụ', value: 'service' },
  { label: 'Khác', value: 'other' },
]

const initialDescription = buildDefaultEditorState({ text: '' })

const initialForm: ListingCreateForm = {
  title: '',
  listingType: 'job-seeking',
  categoryId: '',
  priceLabel: 'Thỏa thuận',
  summary: '',
  description: initialDescription,
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

function hasLexicalContent(value: DefaultTypedEditorState | undefined): boolean {
  const children = value?.root?.children
  if (!Array.isArray(children)) return false

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false

    const text = (node as { text?: unknown }).text
    if (typeof text === 'string' && text.trim()) return true

    const childNodes = (node as { children?: unknown }).children
    if (Array.isArray(childNodes)) return childNodes.some(walk)

    return false
  }

  return children.some(walk)
}

function getUploadError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF'
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return 'Mỗi ảnh tối đa 10MB'
  }

  return null
}

function pickFileName(file: File): string {
  return file.name?.trim() || `upload-${Date.now()}`
}

function createEditorStateFromValue(
  value: DefaultTypedEditorState | undefined,
): string | undefined {
  if (!value?.root?.children?.length) return undefined
  return JSON.stringify(value)
}

function MediaPreview({ item, onRemove }: { item: UploadedMedia; onRemove: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
      {item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={item.alt || 'Uploaded image'}
          className="aspect-4/3 w-full object-cover"
          src={item.url}
        />
      ) : (
        <div className="flex aspect-4/3 items-center justify-center text-xs text-muted-foreground">
          Không xem trước được ảnh
        </div>
      )}
      <button
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition-opacity hover:opacity-90"
        onClick={onRemove}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Xóa ảnh</span>
      </button>
    </div>
  )
}

function ToolbarButton({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-9 sm:w-9',
        active && 'bg-muted text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function EditorToolbar() {
  const [editor] = useLexicalComposerContext()
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  })

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          setFormats({ bold: false, italic: false, underline: false })
          return
        }

        setFormats({
          bold: selection.hasFormat('bold'),
          italic: selection.hasFormat('italic'),
          underline: selection.hasFormat('underline'),
        })
      })
    })
  }, [editor])

  return (
    <div className="flex flex-wrap gap-1.5 border-b border-border bg-muted/20 p-2 sm:gap-2 sm:p-3">
      <ToolbarButton
        active={formats.bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formats.italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={formats.underline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}>
        <X className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return
            selection.insertNodes([$createHeadingNode('h1')])
          })
        }}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return
            selection.insertNodes([$createQuoteNode()])
          })
        }}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

function ensureEditorHasParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const root = $getRoot()
    if (root.getChildrenSize() > 0) return

    const paragraph = $createParagraphNode()
    paragraph.append($createTextNode(''))
    root.append(paragraph)
  })
}

function ListingDescriptionEditor({
  value,
  onChange,
}: {
  onChange: (value: DefaultTypedEditorState) => void
  value: DefaultTypedEditorState
}) {
  const initialConfig = useMemo(
    () => ({
      namespace: 'listing-create-description',
      theme: {
        paragraph: 'mb-3',
        quote: 'border-l-4 border-border pl-4 italic text-muted-foreground',
        heading: {
          h1: 'text-2xl font-bold mb-3',
        },
        list: {
          ul: 'list-disc pl-6 mb-3',
          ol: 'list-decimal pl-6 mb-3',
          listitem: 'mb-1',
        },
        text: {
          bold: 'font-bold',
          italic: 'italic',
          underline: 'underline',
        },
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
      editorState: createEditorStateFromValue(value),
      onError: (error: Error) => {
        throw error
      },
    }),
    [],
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="min-h-56">
        <EditorToolbar />
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <RichTextPlugin
            ErrorBoundary={LexicalErrorBoundary}
            contentEditable={
              <ContentEditable className="min-h-40 outline-none [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6" />
            }
            placeholder={
              <div className="pointer-events-none absolute text-sm text-muted-foreground">
                Nhập chi tiết công việc, dịch vụ hoặc nhu cầu của bạn
              </div>
            }
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin
            onChange={(editorState: EditorState, editor: LexicalEditor) => {
              ensureEditorHasParagraph(editor)
              onChange(editorState.toJSON() as DefaultTypedEditorState)
            }}
          />
        </div>
      </div>
    </LexicalComposer>
  )
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
  const [form, setForm] = useState<ListingCreateForm>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [wards, setWards] = useState<WardOption[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<UploadedMedia | null>(null)
  const [thumbnail, setThumbnail] = useState<UploadedMedia | null>(null)
  const [gallery, setGallery] = useState<UploadedMedia[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

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

  const helperText = useMemo(
    () =>
      modalDescription?.trim() ||
      'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
    [modalDescription],
  )

  function resetFormState() {
    setForm({
      ...initialForm,
      categoryId: firstCategory ? String(firstCategory) : '',
      description: buildDefaultEditorState({ text: '' }),
    })
    setAvatar(null)
    setThumbnail(null)
    setGallery([])
    setError(null)
  }

  function updateField(name: keyof Omit<ListingCreateForm, 'description'>, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateDescription(value: DefaultTypedEditorState) {
    setForm((current) => ({
      ...current,
      description: value,
    }))
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
    setOpen(true)
  }

  async function uploadMedia(file: File): Promise<UploadedMedia> {
    const uploadError = getUploadError(file)
    if (uploadError) throw new Error(uploadError)

    const body = new FormData()
    body.append('file', file, pickFileName(file))
    body.append('alt', file.name.replace(/\.[^.]+$/, ''))

    const response = await fetch('/api/listings/media', {
      method: 'POST',
      credentials: 'include',
      body,
    })

    const data = (await response.json().catch(() => ({}))) as {
      error?: string
      doc?: UploadedMedia
    }
    if (!response.ok || !data.doc) {
      throw new Error(data.error || 'Không tải được ảnh lên')
    }

    return data.doc
  }

  async function handleSingleImageUpload(
    file: File | null,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setValue: React.Dispatch<React.SetStateAction<UploadedMedia | null>>,
  ) {
    if (!file) return

    setUploading(true)
    try {
      const uploaded = await uploadMedia(file)
      setValue(uploaded)
      toast.success('Tải ảnh lên thành công')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được ảnh lên'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files?.length) return

    const available = MAX_GALLERY_FILES - gallery.length
    if (available <= 0) {
      toast.error(`Tối đa ${MAX_GALLERY_FILES} ảnh thư viện`)
      return
    }

    setUploadingGallery(true)
    try {
      const selected = Array.from(files).slice(0, available)
      const uploaded = await Promise.all(selected.map((file) => uploadMedia(file)))
      setGallery((current) => [...current, ...uploaded])
      toast.success(`Đã tải lên ${uploaded.length} ảnh`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được ảnh thư viện'
      toast.error(message)
    } finally {
      setUploadingGallery(false)
    }
  }

  async function submitListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!hasLexicalContent(form.description)) {
      const message = 'Nội dung mô tả là bắt buộc'
      setError(message)
      toast.error(message)
      return
    }

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
          avatarId: avatar?.id ?? null,
          categoryId: categoryValue,
          galleryIds: gallery.map((item) => item.id),
          thumbnailId: thumbnail?.id ?? null,
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
      resetFormState()
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
          className="fixed z-70 inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(29,155,240,0.35)] transition-colors hover:bg-[#1686d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d9bf0] active:scale-[0.97] bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[calc(1.25rem+env(safe-area-inset-right,0px))] sm:px-5 md:bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] md:right-[calc(2rem+env(safe-area-inset-right,0px))]"
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
              className="fixed inset-0 z-80"
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
                  className="pointer-events-auto max-h-[min(92vh,90dvh)] w-full overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 24 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 18 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:gap-4 sm:p-5">
                    <div className="min-w-0 flex-1 pr-1">
                      <h2
                        className="text-lg font-bold leading-tight sm:text-xl"
                        id={titleId}
                      >
                        {modalTitle}
                      </h2>
                      <p
                        className="mt-1 text-sm leading-relaxed text-muted-foreground sm:leading-6"
                        id={descriptionId}
                      >
                        {helperText}
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
                    className="max-h-[calc(min(92vh,90dvh)-104px)] overflow-y-auto p-4 sm:max-h-[calc(92vh-112px)] sm:p-5"
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

                    <div className="grid gap-3 pb-12 sm:gap-4 sm:pb-15 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                      <div className="grid gap-4 md:grid-cols-2">
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
                            onChange={(event) =>
                              updateField('categoryId', event.currentTarget.value)
                            }
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
                            onChange={(event) =>
                              updateField('priceLabel', event.currentTarget.value)
                            }
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
                          <div className="overflow-hidden rounded-xl border border-border bg-background">
                            <ListingDescriptionEditor
                              onChange={updateDescription}
                              value={form.description}
                            />
                          </div>
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

                      <div className="space-y-5">
                        <UploadField
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          description="Ảnh đại diện người đăng. Tùy chọn."
                          label="Avatar"
                          loading={uploadingAvatar}
                          onChange={(event) => {
                            void handleSingleImageUpload(
                              event.currentTarget.files?.[0] ?? null,
                              setUploadingAvatar,
                              setAvatar,
                            )
                            event.currentTarget.value = ''
                          }}
                        />
                        {avatar ? (
                          <MediaPreview item={avatar} onRemove={() => setAvatar(null)} />
                        ) : null}

                        <UploadField
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          description="Ảnh thumbnail hiển thị ngoài danh sách. Tùy chọn."
                          label="Thumbnail"
                          loading={uploadingThumbnail}
                          onChange={(event) => {
                            void handleSingleImageUpload(
                              event.currentTarget.files?.[0] ?? null,
                              setUploadingThumbnail,
                              setThumbnail,
                            )
                            event.currentTarget.value = ''
                          }}
                        />
                        {thumbnail ? (
                          <MediaPreview item={thumbnail} onRemove={() => setThumbnail(null)} />
                        ) : null}

                        <UploadField
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          description={`Tối đa ${MAX_GALLERY_FILES} ảnh. Có thể chọn nhiều ảnh cùng lúc.`}
                          label="Thư viện ảnh"
                          loading={uploadingGallery}
                          multiple
                          onChange={(event) => {
                            void handleGalleryUpload(event.currentTarget.files)
                            event.currentTarget.value = ''
                          }}
                        />
                        {gallery.length ? (
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {gallery.map((item) => (
                              <MediaPreview
                                key={item.id}
                                item={item}
                                onRemove={() =>
                                  setGallery((current) =>
                                    current.filter((entry) => entry.id !== item.id),
                                  )
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </form>
                  <div className="sticky bottom-0 mt-4 flex flex-col gap-2 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-4 sm:pb-4">
                    <button
                      className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98] sm:w-auto"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      Hủy
                    </button>
                    <button
                      form="listing-create-form"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1d9bf0] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1686d9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={
                        pending || uploadingAvatar || uploadingThumbnail || uploadingGallery
                      }
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
  'h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none transition-colors focus:border-foreground/50 md:text-sm'

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

function UploadField({
  accept,
  description,
  label,
  loading,
  multiple,
  onChange,
}: {
  accept: string
  description?: string
  label: string
  loading?: boolean
  multiple?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      <span>{label}</span>
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 sm:p-4">
        <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">Chọn ảnh để tải lên</p>
            {description ? <p className="text-xs leading-5">{description}</p> : null}
          </div>
        </div>
        <input
          accept={accept}
          className="mt-3 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-[#1d9bf0] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1686d9]"
          multiple={multiple}
          onChange={onChange}
          type="file"
        />
      </div>
    </label>
  )
}
