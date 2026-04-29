import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const MediaGifs: CollectionConfig = {
  slug: 'media-gifs',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
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
