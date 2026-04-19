'use client'

import { useField } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

import { getLivestreamBroadcasterAbsoluteUrl } from '@/utilities/livestreamBroadcasterUrl'

export function LivestreamBroadcasterLinksField() {
  const { value: slug } = useField<string>({ path: 'slug' })
  const absoluteUrl = getLivestreamBroadcasterAbsoluteUrl(slug)
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    if (!absoluteUrl) return
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [absoluteUrl])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      <div style={{ fontWeight: 600 }}>Broadcaster URL (Admin)</div>
      {!slug?.trim() ? (
        <span style={{ color: 'var(--theme-elevation-500)' }}>No slug — save a slug to preview.</span>
      ) : absoluteUrl ? (
        <>
          <code style={{ fontSize: '0.9em', wordBreak: 'break-all' }}>{absoluteUrl}</code>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <a href={absoluteUrl} rel="noopener noreferrer" target="_blank">
              Open broadcaster
            </a>
            <button
              onClick={(e) => {
                e.preventDefault()
                void onCopy()
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--theme-text)',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
              type="button"
            >
              {copied ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
