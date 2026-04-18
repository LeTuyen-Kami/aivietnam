import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            en: 'Categories (top)',
            vi: 'Chuyên mục (trên)',
          },
          fields: [
            {
              name: 'categoriesHeading',
              type: 'text',
              label: {
                en: 'Section heading',
                vi: 'Tiêu đề khu vực',
              },
              defaultValue: 'Chuyên mục',
            },
            {
              name: 'categoryColumns',
              type: 'array',
              label: {
                en: 'Columns',
                vi: 'Cột',
              },
              maxRows: 6,
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/CategoryColumnRowLabel#CategoryColumnRowLabel',
                },
              },
              fields: [
                {
                  name: 'links',
                  type: 'array',
                  label: {
                    en: 'Links in this column',
                    vi: 'Liên kết trong cột',
                  },
                  admin: {
                    initCollapsed: true,
                    components: {
                      RowLabel: '@/Footer/RowLabel#RowLabel',
                    },
                  },
                  fields: [
                    link({
                      appearances: false,
                    }),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Bottom — left',
            vi: 'Dưới — trái',
          },
          fields: [
            {
              name: 'downloadsTitle',
              type: 'text',
              label: {
                en: 'App downloads title',
                vi: 'Tiêu đề tải app',
              },
              defaultValue: 'Tải ứng dụng',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'appStoreUrl',
                  type: 'text',
                  label: 'App Store URL',
                },
                {
                  name: 'googlePlayUrl',
                  type: 'text',
                  label: 'Google Play URL',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'appStoreBadge',
                  type: 'upload',
                  relationTo: 'media',
                  label: {
                    en: 'App Store badge image',
                    vi: 'Ảnh badge App Store',
                  },
                },
                {
                  name: 'googlePlayBadge',
                  type: 'upload',
                  relationTo: 'media',
                  label: {
                    en: 'Google Play badge image',
                    vi: 'Ảnh badge Google Play',
                  },
                },
              ],
            },
            {
              name: 'hotlineTitle',
              type: 'text',
              label: {
                en: 'Hotline block title',
                vi: 'Tiêu đề đường dây nóng',
              },
              defaultValue: 'Đường dây nóng',
            },
            {
              name: 'hotlines',
              type: 'array',
              label: {
                en: 'Hotlines',
                vi: 'Đường dây nóng',
              },
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: {
                    en: 'Region label (e.g. Hà Nội:)',
                    vi: 'Nhãn khu vực',
                  },
                  required: true,
                },
                {
                  name: 'phone',
                  type: 'text',
                  label: {
                    en: 'Phone (display)',
                    vi: 'Số điện thoại (hiển thị)',
                  },
                  required: true,
                },
                {
                  name: 'href',
                  type: 'text',
                  label: {
                    en: 'Link (tel:… or URL)',
                    vi: 'Liên kết (tel:…)',
                  },
                  admin: {
                    description: 'Example: tel:+84938381100',
                  },
                  required: true,
                },
              ],
            },
            {
              name: 'contactLinksHeading',
              type: 'text',
              label: {
                en: 'Contact links heading',
                vi: 'Tiêu đề liên hệ',
              },
              defaultValue: 'Liên hệ',
            },
            {
              name: 'contactLinks',
              type: 'array',
              label: {
                en: 'Contact links',
                vi: 'Mục liên hệ',
              },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/ContactLinkRowLabel#ContactLinkRowLabel',
                },
              },
              fields: [
                {
                  name: 'icon',
                  type: 'select',
                  label: {
                    en: 'Icon',
                    vi: 'Biểu tượng',
                  },
                  required: true,
                  options: [
                    { label: 'Envelope', value: 'mail' },
                    { label: 'Megaphone (quảng cáo)', value: 'advertising' },
                    { label: 'Document', value: 'terms' },
                    { label: 'Shield', value: 'privacy' },
                    { label: 'Cookie', value: 'cookies' },
                  ],
                },
                link({
                  appearances: false,
                }),
              ],
            },
          ],
        },
        {
          label: {
            en: 'Bottom — center',
            vi: 'Dưới — giữa',
          },
          fields: [
            {
              name: 'featureImage',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Feature image',
                vi: 'Ảnh nổi bật',
              },
            },
            {
              name: 'brandTitle',
              type: 'text',
              label: {
                en: 'Brand title',
                vi: 'Tên thương hiệu',
              },
              defaultValue: 'AI VIỆT NAM',
            },
            {
              name: 'brandTagline',
              type: 'text',
              label: {
                en: 'Tagline',
                vi: 'Khẩu hiệu',
              },
              defaultValue: 'AI cho toàn dân - kết nối, chia sẻ, phát triển',
            },
            {
              name: 'contentResponsibility',
              type: 'textarea',
              label: {
                en: 'Content responsibility line',
                vi: 'Dòng chịu trách nhiệm nội dung',
              },
            },
            {
              name: 'headquartersLabel',
              type: 'text',
              label: {
                en: 'Headquarters label',
                vi: 'Nhãn trụ sở',
              },
              defaultValue: 'Trụ sở chính:',
            },
            {
              name: 'headquartersAddress',
              type: 'textarea',
              label: {
                en: 'Headquarters address',
                vi: 'Địa chỉ trụ sở',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'phoneLabel',
                  type: 'text',
                  label: {
                    en: 'Phone label',
                    vi: 'Nhãn điện thoại',
                  },
                  defaultValue: 'Điện thoại:',
                },
                {
                  name: 'centerPhone',
                  type: 'text',
                  label: {
                    en: 'Phone (display)',
                    vi: 'SĐT hiển thị',
                  },
                },
              ],
            },
            {
              name: 'centerPhoneHref',
              type: 'text',
              label: {
                en: 'Phone link',
                vi: 'Liên kết SĐT',
              },
              admin: {
                description: 'tel:… — optional if empty, uses center phone',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'emailLabel',
                  type: 'text',
                  label: {
                    en: 'Email label',
                    vi: 'Nhãn email',
                  },
                  defaultValue: 'Email:',
                },
                {
                  name: 'centerEmail',
                  type: 'text',
                  label: {
                    en: 'Email address',
                    vi: 'Địa chỉ email',
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            en: 'Bottom — right',
            vi: 'Dưới — phải',
          },
          fields: [
            {
              name: 'socialHeading',
              type: 'text',
              label: {
                en: 'Social heading',
                vi: 'Tiêu đề mạng xã hội',
              },
              defaultValue: 'Theo dõi AI Việt Nam trên',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'socialFacebook',
                  type: 'text',
                  label: 'Facebook URL',
                },
                {
                  name: 'socialX',
                  type: 'text',
                  label: 'X (Twitter) URL',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'socialYoutube',
                  type: 'text',
                  label: 'YouTube URL',
                },
                {
                  name: 'socialTiktok',
                  type: 'text',
                  label: 'TikTok URL',
                },
              ],
            },
            {
              name: 'socialRss',
              type: 'text',
              label: 'RSS URL',
            },
            {
              name: 'promoTitle',
              type: 'text',
              label: {
                en: 'Promo box title',
                vi: 'Tiêu đề ô quảng bá',
              },
            },
            {
              name: 'promoSubtitle',
              type: 'text',
              label: {
                en: 'Promo box subtitle',
                vi: 'Phụ đề ô quảng bá',
              },
            },
            {
              name: 'promoHref',
              type: 'text',
              label: {
                en: 'Promo link',
                vi: 'Liên kết ô quảng bá',
              },
            },
            {
              name: 'licenseLine',
              type: 'textarea',
              label: {
                en: 'Licensing line',
                vi: 'Dòng giấy phép / VNNIC',
              },
            },
            {
              name: 'copyrightLine',
              type: 'text',
              label: {
                en: 'Copyright',
                vi: 'Bản quyền',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
