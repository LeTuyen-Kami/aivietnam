'use client'

import type { DefaultCellComponentProps } from 'payload'
import type { TextFieldClient } from 'payload'
import { useCallback, useState } from 'react'

function toRelativePath(url: string | undefined): string {
  if (!url?.trim()) return ''

  const trimmed = url.trim()

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname
    } catch {
      return trimmed
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function MediaUrlCell(props: DefaultCellComponentProps<TextFieldClient>) {
  const relativePath = toRelativePath(props.cellData as string | undefined)
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    if (!relativePath) return
    try {
      await navigator.clipboard.writeText(relativePath)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be denied — ignore
    }
  }, [relativePath])

  if (!relativePath) {
    return <span style={{ color: 'var(--theme-elevation-500)' }}>—</span>
  }

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '8px',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <code
        style={{
          flex: 1,
          fontSize: '12px',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={relativePath}
      >
        {relativePath}
      </code>
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
          flexShrink: 0,
          padding: 0,
          textDecoration: 'underline',
          whiteSpace: 'nowrap',
        }}
        type="button"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
