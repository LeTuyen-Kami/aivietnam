import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { staff } from '../access/staff'

export const MediaGifs: CollectionConfig = {
  slug: 'media-gifs',
  folders: true,
  access: {
    create: staff,
    delete: staff,
    read: anyone,
    update: staff,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    // Chỉ nhận GIF và không cấu hình `imageSizes` để tránh resize/conversion.
    disableLocalStorage: true,
    // Dùng URL gốc làm thumbnail trong Admin (không cần tạo imageSizes/resize).
    adminThumbnail: ({ doc }) => {
      const url = doc?.url
      return typeof url === 'string' ? url : null
    },
    mimeTypes: ['image/gif'],
    crop: false,
    focalPoint: false,
    imageSizes: [],
  },
}
