import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

export const HeroCarousel: Block = {
  slug: 'heroCarousel',
  interfaceName: 'HeroCarouselBlock',
  labels: {
    singular: {
      en: 'Hero carousel',
      vi: 'Hero carousel',
    },
    plural: {
      en: 'Hero carousels',
      vi: 'Hero carousels',
    },
  },
  fields: [
    {
      name: 'autoplayDelay',
      type: 'number',
      defaultValue: 5000,
      min: 0,
      admin: {
        description: {
          en: 'Autoplay delay in milliseconds. Set 0 to disable autoplay.',
          vi: 'Thời gian tự động chuyển slide (ms). Đặt 0 để tắt autoplay.',
        },
      },
    },
    {
      name: 'slides',
      type: 'array',
      minRows: 1,
      required: true,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'image',
          options: [
            {
              label: {
                en: 'Image slide',
                vi: 'Slide hình ảnh',
              },
              value: 'image',
            },
            {
              label: {
                en: 'CTA hero slide',
                vi: 'Slide hero có CTA',
              },
              value: 'ctaHero',
            },
          ],
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'image',
            description: {
              en: 'Optional link for image slides.',
              vi: 'Liên kết tùy chọn cho slide hình ảnh.',
            },
            placeholder: 'https:// hoặc /duong-dan',
          },
        },
        {
          name: 'eyebrow',
          type: 'text',
          label: {
            en: 'Eyebrow',
            vi: 'Dòng nhỏ phía trên',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'ctaHero',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: {
            en: 'Title',
            vi: 'Tiêu đề',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'ctaHero',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: {
            en: 'Description',
            vi: 'Mô tả',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'ctaHero',
          },
        },
        linkGroup({
          appearances: ['default', 'outline'],
          overrides: {
            maxRows: 4,
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'ctaHero',
            },
          },
        }),
      ],
    },
  ],
}
