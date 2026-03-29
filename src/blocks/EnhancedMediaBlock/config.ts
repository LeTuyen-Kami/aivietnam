import type { Block, TextFieldValidation } from 'payload'

export const EnhancedMediaBlock: Block = {
  slug: 'enhancedMediaBlock',
  interfaceName: 'EnhancedMediaBlock',
  labels: {
    singular: {
      en: 'Enhanced media',
      vi: 'Media nâng cao',
    },
    plural: {
      en: 'Enhanced media',
      vi: 'Media nâng cao',
    },
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'href',
      type: 'text',
      label: {
        en: 'Link URL (optional)',
        vi: 'Liên kết (tùy chọn)',
      },
      admin: {
        description: {
          en: 'If set, the image/video becomes clickable. Internal paths (e.g. /posts/slug) or https://, mailto:, tel:.',
          vi: 'Nếu có, ảnh/video có thể bấm. Đường dẫn trong site (vd: /posts/slug) hoặc https://, mailto:, tel:.',
        },
        placeholder: 'https://',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'widthScope',
          type: 'select',
          label: {
            en: 'Width',
            vi: 'Độ rộng',
          },
          defaultValue: 'container',
          options: [
            {
              label: {
                en: 'Within page container',
                vi: 'Trong khung container trang',
              },
              value: 'container',
            },
            {
              label: {
                en: 'Full viewport (edge-to-edge)',
                vi: 'Tràn màn hình (ra ngoài container)',
              },
              value: 'viewport',
            },
          ],
          admin: {
            description: {
              en: 'Container: media stays inside the site content width. Viewport: breaks out to full browser width.',
              vi: 'Trong container: media nằm trong khung nội dung trang. Tràn màn hình: ảnh rộng hết cửa sổ, vượt ra ngoài container.',
            },
            width: '50%',
          },
        },
        {
          name: 'priority',
          type: 'checkbox',
          label: {
            en: 'Load with priority (LCP)',
            vi: 'Ưu tiên tải (LCP)',
          },
          defaultValue: false,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      admin: {
        condition: (_, siblingData) => {
          const s = siblingData as { widthScope?: string; fullWidth?: boolean | null }
          const viewport =
            s?.widthScope === 'viewport' || s?.fullWidth === true
          return !viewport
        },
      },
      fields: [
        {
          name: 'maxWidth',
          type: 'select',
          label: {
            en: 'Max width (inside container)',
            vi: 'Độ rộng tối đa (trong container)',
          },
          defaultValue: 'full',
          options: [
            {
              label: {
                en: 'Full width of container',
                vi: 'Hết khung container',
              },
              value: 'full',
            },
            { label: '7xl (80rem)', value: '7xl' },
            { label: '5xl (64rem)', value: '5xl' },
            { label: '3xl (48rem)', value: '3xl' },
          ],
        },
        {
          name: 'alignment',
          type: 'select',
          label: {
            en: 'Alignment',
            vi: 'Căn ngang',
          },
          defaultValue: 'center',
          options: [
            { label: { en: 'Left', vi: 'Trái' }, value: 'left' },
            { label: { en: 'Center', vi: 'Giữa' }, value: 'center' },
            { label: { en: 'Right', vi: 'Phải' }, value: 'right' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'aspectRatio',
          type: 'select',
          label: {
            en: 'Aspect ratio',
            vi: 'Tỉ lệ khung',
          },
          defaultValue: 'auto',
          options: [
            { label: { en: 'Auto (intrinsic)', vi: 'Tự nhiên' }, value: 'auto' },
            { label: '1:1', value: '1/1' },
            { label: '4:3', value: '4/3' },
            { label: '3:2', value: '3/2' },
            { label: '16:9', value: '16/9' },
            { label: '21:9', value: '21/9' },
            { label: '2:3', value: '2/3' },
            { label: '9:16', value: '9/16' },
            {
              label: { en: 'Custom (enter below)', vi: 'Tùy chỉnh (nhập bên dưới)' },
              value: 'custom',
            },
          ],
        },
        {
          name: 'aspectRatioCustom',
          type: 'text',
          label: {
            en: 'Custom aspect ratio',
            vi: 'Tỉ lệ tùy chỉnh',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.aspectRatio === 'custom',
            description: {
              en: 'Width and height separated by / or : (examples: 16/9, 2.35:1, 1.85/1).',
              vi: 'Chiều ngang và chiều cao, cách nhau bởi / hoặc : (ví dụ: 16/9, 2.35:1, 1.85/1).',
            },
            placeholder: '16/9',
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { aspectRatio?: string })?.aspectRatio !== 'custom') return true
            const raw = typeof value === 'string' ? value.trim() : ''
            if (!raw) {
              return 'Nhập tỉ lệ (vd: 16/9) hoặc chọn preset khác.'
            }
            const normalized = raw.replace(/\s+/g, '').replace(':', '/')
            if (!/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(normalized)) {
              return 'Dùng dạng rộng/cao, ví dụ 16/9 hoặc 2.35/1.'
            }
            return true
          }) as TextFieldValidation,
        },
        {
          name: 'objectFit',
          type: 'select',
          label: {
            en: 'Object fit',
            vi: 'Vừa khung',
          },
          defaultValue: 'cover',
          options: [
            { label: 'Cover', value: 'cover' },
            { label: 'Contain', value: 'contain' },
          ],
          admin: {
            condition: (_, siblingData) => {
              const ar = siblingData?.aspectRatio
              if (!ar || ar === 'auto') return false
              if (ar === 'custom') return Boolean(siblingData?.aspectRatioCustom?.trim?.())
              return true
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'cornerRadius',
          type: 'select',
          label: {
            en: 'Corner radius',
            vi: 'Bo góc',
          },
          defaultValue: 'lg',
          options: [
            { label: { en: 'None', vi: 'Không' }, value: 'none' },
            { label: 'SM', value: 'sm' },
            { label: 'MD', value: 'md' },
            { label: 'LG', value: 'lg' },
            { label: 'XL', value: 'xl' },
            { label: '2XL', value: '2xl' },
            { label: { en: 'Full (pill)', vi: 'Tròn (pill)' }, value: 'full' },
          ],
        },
        {
          name: 'borderStyle',
          type: 'select',
          label: {
            en: 'Border',
            vi: 'Viền',
          },
          defaultValue: 'default',
          options: [
            { label: { en: 'None', vi: 'Không' }, value: 'none' },
            { label: { en: 'Subtle', vi: 'Nhẹ' }, value: 'subtle' },
            { label: { en: 'Default', vi: 'Mặc định' }, value: 'default' },
          ],
        },
        {
          name: 'shadow',
          type: 'select',
          label: {
            en: 'Shadow',
            vi: 'Đổ bóng',
          },
          defaultValue: 'none',
          options: [
            { label: { en: 'None', vi: 'Không' }, value: 'none' },
            { label: 'SM', value: 'sm' },
            { label: 'MD', value: 'md' },
            { label: 'LG', value: 'lg' },
            { label: 'XL', value: 'xl' },
          ],
        },
      ],
    },
  ],
}
