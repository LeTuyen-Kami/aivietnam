'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

/**
 * Segmented multi-select điều khiển 3 boolean ẩn (displayOnMobile/Tablet/Desktop).
 * Dùng để chọn thiết bị mà bài viết được phép xuất hiện trong feed "latest" của
 * block Portal - 2 column (left column source). KHÔNG ảnh hưởng khi admin chọn
 * đích danh bài viết, và không ảnh hưởng trang chi tiết bài viết.
 */
const SEGMENTS = [
  { path: 'displayOnMobile', label: 'Mobile' },
  { path: 'displayOnTablet', label: 'Tablet' },
  { path: 'displayOnDesktop', label: 'Desktop' },
] as const

const Segment: React.FC<{ path: string; label: string; first: boolean; last: boolean }> = ({
  path,
  label,
  first,
  last,
}) => {
  // defaultValue của field là true → coi undefined là đang bật.
  const { value, setValue } = useField<boolean>({ path })
  const active = value !== false

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => setValue(!active)}
      style={{
        flex: 1,
        padding: '6px 10px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        border: '1px solid var(--theme-elevation-150)',
        borderLeftWidth: first ? '1px' : 0,
        borderTopLeftRadius: first ? '4px' : 0,
        borderBottomLeftRadius: first ? '4px' : 0,
        borderTopRightRadius: last ? '4px' : 0,
        borderBottomRightRadius: last ? '4px' : 0,
        background: active ? 'var(--theme-success-500, #2e8b57)' : 'var(--theme-elevation-50)',
        color: active ? '#fff' : 'var(--theme-elevation-600)',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

export const PostDisplayOn: React.FC = () => {
  return (
    <div className="field-type" style={{ marginBottom: '16px' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>
        Hiển thị trên thiết bị
      </label>
      <div style={{ display: 'flex' }}>
        {SEGMENTS.map((segment, index) => (
          <Segment
            key={segment.path}
            first={index === 0}
            label={segment.label}
            last={index === SEGMENTS.length - 1}
            path={segment.path}
          />
        ))}
      </div>
      <p
        style={{
          marginTop: '6px',
          marginBottom: 0,
          fontSize: '12px',
          color: 'var(--theme-elevation-500)',
        }}
      >
        Áp dụng cho cột trái (left source) của block Portal - 2 column — cả khi chọn thủ công lẫn
        lấy bài mới nhất. Bỏ chọn một thiết bị để ẩn bài này trên thiết bị đó.
      </p>
    </div>
  )
}
