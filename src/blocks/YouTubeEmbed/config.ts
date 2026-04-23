import type { Block, TextFieldValidation } from 'payload'

const youtubeUrlValidation = ((value) => {
  const raw = typeof value === 'string' ? value.trim() : ''

  if (!raw) {
    return 'Nhập link YouTube.'
  }

  try {
    const url = new URL(raw)
    const isYouTubeHost =
      url.hostname === 'youtu.be' ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('youtube-nocookie.com')

    if (!isYouTubeHost) {
      return 'Link phải thuộc YouTube.'
    }

    return true
  } catch {
    return 'Link YouTube không hợp lệ.'
  }
}) as TextFieldValidation

export const YouTubeEmbed: Block = {
  slug: 'youtubeEmbed',
  interfaceName: 'YouTubeEmbedBlock',
  labels: {
    singular: {
      en: 'YouTube embed',
      vi: 'Nhúng YouTube',
    },
    plural: {
      en: 'YouTube embeds',
      vi: 'Nhúng YouTube',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        en: 'Section title (optional)',
        vi: 'Tiêu đề block (tùy chọn)',
      },
    },
    {
      name: 'videoTitle',
      type: 'text',
      required: true,
      label: {
        en: 'Video title',
        vi: 'Tiêu đề video',
      },
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      label: {
        en: 'YouTube URL',
        vi: 'Link YouTube',
      },
      validate: youtubeUrlValidation,
      admin: {
        placeholder: 'https://www.youtube.com/watch?v=...',
      },
    },
  ],
}
