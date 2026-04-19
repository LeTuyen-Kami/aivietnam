'use client'

import type { DefaultCellComponentProps } from 'payload'
import type { TextFieldClient } from 'payload'
import { useCallback, useState } from 'react'

import { getLivestreamViewerAbsoluteUrl } from '@/utilities/livestreamViewerUrl'

export function LivestreamSlugActionsCell(
  props: DefaultCellComponentProps<TextFieldClient>,
) {
  const slug = props.cellData as string | undefined
  const absoluteUrl = getLivestreamViewerAbsoluteUrl(slug)
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    if (!absoluteUrl) return
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be denied — ignore
    }
  }, [absoluteUrl])

  if (!slug?.trim()) {
    return <span style={{ color: 'var(--theme-elevation-500)' }}>—</span>
  }

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <span>{slug}</span>
      {absoluteUrl ? (
        <>
          <a
            href={absoluteUrl}
            rel="noopener noreferrer"
            style={{ whiteSpace: 'nowrap' }}
            target="_blank"
          >
            Open viewer
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
              whiteSpace: 'nowrap',
            }}
            type="button"
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
        </>
      ) : null}
    </div>
  )
}
