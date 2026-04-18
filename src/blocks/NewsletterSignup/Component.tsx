'use client'

import type { Form as FormType } from '@/payload-types'
import { Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'

import RichText from '@/components/RichText'
import { SmartLink } from '@/components/SmartLink'
import { getClientSideURL } from '@/utilities/getURL'
import { cn } from '@/utilities/ui'

export type NewsletterSignupBlockType = {
  blockType?: 'newsletterSignup'
  form: number | FormType
  eyebrow?: string | null
  headline?: string | null
  description?: string | null
  emailPlaceholder?: string | null
  submitLabel?: string | null
  disclaimer?: string | null
  termsUrl?: string | null
  className?: string | null
}

function isPopulatedForm(form: number | FormType): form is FormType {
  return typeof form === 'object' && form !== null && 'fields' in form
}

/** Split disclaimer so the word matching `termsWord` links to termsUrl when set. */
function DisclaimerWithTermsLink(props: {
  text: string
  termsUrl: string | null | undefined
  termsWord: string
}) {
  const { text, termsUrl, termsWord } = props
  const raw = termsUrl?.trim() ?? ''
  const idx = text.indexOf(termsWord)

  if (!raw || idx < 0) {
    return <span className="text-neutral-400">{text}</span>
  }

  const before = text.slice(0, idx)
  const after = text.slice(idx + termsWord.length)

  return (
    <span className="text-neutral-400">
      {before}
      <SmartLink
        className="text-neutral-600 underline underline-offset-2 hover:text-neutral-800"
        href={raw}
      >
        {termsWord}
      </SmartLink>
      {after}
    </span>
  )
}

export const NewsletterSignupBlock: React.FC<NewsletterSignupBlockType> = (props) => {
  const {
    form,
    eyebrow = 'Read on AIVIETNAM',
    headline = 'Đừng bỏ lỡ góc nhìn AI quan trọng!',
    description = '',
    emailPlaceholder = 'Email',
    submitLabel = 'ĐĂNG KÝ',
    disclaimer = '*Khi đăng ký, bạn đồng ý điều khoản của AIVIETNAM',
    termsUrl,
    className,
  } = props

  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()

  const emailFieldName = useMemo(() => {
    if (!isPopulatedForm(form) || !form.fields?.length) return null
    const emailField = form.fields.find((f) => f.blockType === 'email')
    return emailField?.name ?? null
  }, [form])

  const formID = isPopulatedForm(form) ? form.id : null
  const confirmationType = isPopulatedForm(form) ? form.confirmationType : undefined
  const redirect = isPopulatedForm(form) ? form.redirect : undefined

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(undefined)

      if (!formID || !emailFieldName) {
        setError({ message: 'Form chưa được cấu hình đúng (cần trường Email).' })
        return
      }

      const trimmed = email.trim()
      if (!trimmed) {
        setError({ message: 'Vui lòng nhập email.' })
        return
      }

      const emailPattern = /^\S[^\s@]*@\S+$/
      if (!emailPattern.test(trimmed)) {
        setError({ message: 'Email không hợp lệ.' })
        return
      }

      setIsLoading(true)

      try {
        const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
          body: JSON.stringify({
            form: formID,
            submissionData: [{ field: emailFieldName, value: trimmed }],
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = (await req.json()) as { errors?: { message?: string }[] }

        if (req.status >= 400) {
          setIsLoading(false)
          setError({
            message: res.errors?.[0]?.message || 'Không gửi được. Thử lại sau.',
            status: String(req.status),
          })
          return
        }

        setIsLoading(false)
        setHasSubmitted(true)

        if (confirmationType === 'redirect' && redirect?.url) {
          router.push(redirect.url)
        }
      } catch {
        setIsLoading(false)
        setError({ message: 'Có lỗi xảy ra.' })
      }
    },
    [email, emailFieldName, formID, confirmationType, redirect, router],
  )

  if (!isPopulatedForm(form)) {
    return (
      <div className="rounded-sm border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
        Chọn một form (Forms) trong admin để kích hoạt đăng ký nhận tin.
      </div>
    )
  }

  if (!emailFieldName) {
    return (
      <div className="rounded-sm border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-900">
        Form đã chọn cần có ít nhất một trường kiểu Email trong Form Builder.
      </div>
    )
  }

  const termsWord = 'điều khoản'

  return (
    <div
      className={cn(
        'rounded-sm border border-neutral-200 px-8 py-10 md:px-10 bg-[#FDFBF7]',
        className,
      )}
    >
      {hasSubmitted && form.confirmationType === 'message' && form.confirmationMessage ? (
        <RichText
          className="font-serif text-neutral-800 [&_a]:underline"
          data={form.confirmationMessage}
          enableGutter={false}
        />
      ) : hasSubmitted ? (
        <p className="font-serif text-lg text-neutral-800">Cảm ơn bạn đã đăng ký!</p>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="flex items-center gap-2 font-serif text-[15px] text-neutral-500">
            <Mail aria-hidden className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={2} />
            <span>{eyebrow}</span>
          </div>

          <h2 className="font-serif text-2xl font-bold leading-tight text-neutral-900 md:text-[1.65rem]">
            {headline}
          </h2>

          {description ? (
            <p className="font-serif text-sm leading-relaxed text-neutral-700 md:text-[15px]">
              {description}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <label className="sr-only" htmlFor="newsletter-email">
              Email
            </label>
            <input
              autoComplete="email"
              className="min-h-11 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 font-sans text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              disabled={isLoading}
              id="newsletter-email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder ?? 'Email'}
              type="email"
              value={email}
            />
            <button
              className="min-h-11 shrink-0 rounded-md bg-[#D93025] px-6 font-sans text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? '…' : submitLabel}
            </button>
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error.status ? `${error.status}: ` : ''}
              {error.message}
            </p>
          ) : null}

          {disclaimer ? (
            <p className="font-serif text-[11px] leading-snug md:text-xs">
              <DisclaimerWithTermsLink
                termsUrl={termsUrl}
                termsWord={termsWord}
                text={disclaimer}
              />
            </p>
          ) : null}
        </form>
      )}
    </div>
  )
}
