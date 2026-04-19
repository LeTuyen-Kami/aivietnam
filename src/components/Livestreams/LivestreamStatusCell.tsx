import type { CSSProperties } from 'react'
import type { DefaultServerCellComponentProps } from 'payload'
import type { SelectFieldClient } from 'payload'

const statusStyle: Record<string, CSSProperties> = {
  draft: {
    color: 'var(--theme-elevation-500)',
  },
  scheduled: {
    color: 'var(--theme-warning-500)',
  },
  live: {
    color: 'var(--theme-success-600)',
    fontWeight: 600,
  },
  ended: {
    color: 'var(--theme-elevation-400)',
  },
}

export function LivestreamStatusCell(
  props: DefaultServerCellComponentProps<SelectFieldClient>,
) {
  const value = props.cellData as string | undefined
  if (!value) {
    return <span style={{ color: 'var(--theme-elevation-500)' }}>—</span>
  }

  const style = statusStyle[value] ?? { color: 'var(--theme-text)' }

  return <span style={style}>{value}</span>
}
