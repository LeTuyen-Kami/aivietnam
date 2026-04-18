'use client'

import React, { useEffect, useState } from 'react'
import { useFormFields, useField, Button } from '@payloadcms/ui'

/** Lexical upload nodes often store `value` as a raw id string, not `{ id }`. */
const mediaIdFromValue = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim()
    if (!id || id === '0') return undefined
    return id
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (id != null && (typeof id === 'string' || typeof id === 'number')) {
      const normalizedId = String(id).trim()
      if (!normalizedId || normalizedId === '0') return undefined
      return normalizedId
    }
  }
  return undefined
}

// Helper recursively scans for payload media IDs
const findImageIds = (obj: any): string[] => {
  let ids: string[] = []
  if (!obj || typeof obj !== 'object') return ids

  // Lexical inline/upload node (see SerializedUploadNode, type 'upload')
  if (obj.type === 'upload' && obj.relationTo === 'media') {
    const id = mediaIdFromValue(obj.value)
    if (id) ids.push(id)
  }

  // Blocks that embed an upload (MediaBlock, EnhancedMediaBlock)
  if (
    (obj.blockType === 'mediaBlock' || obj.blockType === 'enhancedMediaBlock') &&
    obj.media
  ) {
    const id = mediaIdFromValue(obj.media)
    if (id) ids.push(id)
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object') {
        ids = ids.concat(findImageIds(obj[key]))
      }
    }
  }

  return Array.from(new Set(ids))
}

export const SeoImageChecker: React.FC = () => {
  const contentField = useFormFields(([fields]) => fields.content)
  const heroImageField = useFormFields(([fields]) => fields.heroImage)
  const metaImageField = useFormFields(([fields]) => fields['meta.image'])
  
  // hook to update meta.image
  const { setValue } = useField<number | string>({ path: 'meta.image' })

  const [availableImages, setAvailableImages] = useState<string[]>([])
  
  const currentMetaImage = metaImageField?.value as string | number | Record<string, any> | undefined

  useEffect(() => {
    let images: string[] = []

    // 1. Get from Hero Image
    if (heroImageField?.value) {
      const heroVal = heroImageField.value as any
      if (typeof heroVal === 'string') {
        const id = mediaIdFromValue(heroVal)
        if (id) images.push(id)
      } else if (heroVal?.id) {
        const id = mediaIdFromValue(heroVal.id)
        if (id) images.push(id)
      }
    }

    // 2. Extract from RichText Content
    if (contentField?.value) {
      images = images.concat(findImageIds(contentField.value))
    }

    // Set unique strings
    setAvailableImages(Array.from(new Set(images)))
  }, [contentField?.value, heroImageField?.value])

  // Normalize meta image id to string for stable comparison
  const metaImageId = mediaIdFromValue(currentMetaImage)

  // Logic: 
  // If there are images available in the post, 
  // AND the metaImage is NOT one of them
  const shouldWarn = availableImages.length > 0 && (!metaImageId || !availableImages.includes(metaImageId))
  const suggestedImageId = availableImages.find(Boolean)

  if (!shouldWarn) return null

  return (
    <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', marginBottom: '24px', borderRadius: '0 4px 4px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ color: '#854d0e', fontWeight: 600, margin: 0, lineHeight: 1 }}>⚠️ Lưu ý SEO Image</h4>
        <p style={{ color: '#a16207', fontSize: '14px', margin: 0 }}>
          Ảnh SEO Meta hiện tại không khớp với bất kỳ ảnh nào đang sử dụng trong nội dung (hoặc chưa được thiết lập). 
          Bạn có muốn sử dụng ảnh đầu tiên của bài viết làm ảnh SEO meta không?
        </p>
        <div style={{ marginTop: '8px' }}>
          <Button
            size="small"
            buttonStyle="primary"
            onClick={(e) => {
              e.preventDefault()
              if (suggestedImageId) {
                const numericId = Number(suggestedImageId)
                if (Number.isFinite(numericId) && numericId > 0) {
                  setValue(numericId)
                } else {
                  setValue(suggestedImageId)
                }
              }
            }}
          >
            Sử dụng thư viện ảnh từ bài viết
          </Button>
        </div>
      </div>
    </div>
  )
}
