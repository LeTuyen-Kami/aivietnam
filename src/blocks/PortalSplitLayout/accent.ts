import type { CSSProperties } from 'react'

import type { AccentKey } from './types'

export type AccentStyle = {
  /** Thanh accent (hex) */
  bar: string
  /** Chữ khi hover (hex) */
  text: string
}

const ACCENTS: Record<string, AccentStyle> = {
  gold: { bar: '#F59E0B', text: '#B45309' },
  yellow: { bar: '#FACC15', text: '#854D0E' },
  green: { bar: '#16A34A', text: '#166534' },
  purple: { bar: '#2D1E5F', text: '#2D1E5F' },
  blue: { bar: '#2563EB', text: '#1E40AF' },
  red: { bar: '#DC2626', text: '#B91C1C' },
  teal: { bar: '#005C5C', text: '#005C5C' },
}

/** Đặt trên wrapper; các class `accentHover.*` dùng biến này */
export const ACCENT_TEXT_VAR = '--portal-accent-text'

export function getAccentStyle(accent: AccentKey | null | undefined): AccentStyle {
  const key = accent ?? 'teal'
  return ACCENTS[key] ?? ACCENTS.teal
}

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}){1,2}$/

export function getAccentStyleWithCustomHex(
  accent: AccentKey | null | undefined,
  customHex: string | null | undefined,
): AccentStyle {
  const fallback = getAccentStyle(accent)
  const normalized = customHex?.trim()

  if (!normalized || !HEX_COLOR_REGEX.test(normalized)) {
    return fallback
  }

  return {
    bar: normalized,
    text: normalized,
  }
}

export function accentTextVarStyle(textHex: string): CSSProperties {
  return { [ACCENT_TEXT_VAR]: textHex } as CSSProperties
}

/** Hover màu accent — cần `accentTextVarStyle(palette.text)` trên tổ tiên */
export const accentHover = {
  group: 'group-hover:[color:var(--portal-accent-text)]',
  feat: 'group-hover/feat:[color:var(--portal-accent-text)]',
  sub: 'group-hover/sub:[color:var(--portal-accent-text)]',
  link: 'hover:[color:var(--portal-accent-text)]',
} as const
