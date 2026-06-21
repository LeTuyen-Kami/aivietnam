import type { Block } from 'payload'

export const MarketplaceStats: Block = {
  slug: 'marketplaceStats',
  interfaceName: 'MarketplaceStatsBlock',
  labels: {
    singular: {
      en: 'Marketplace stats',
      vi: 'Thống kê sàn giao dịch',
    },
    plural: {
      en: 'Marketplace stats blocks',
      vi: 'Các khối thống kê sàn giao dịch',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        en: 'Title',
        vi: 'Tiêu đề',
      },
      defaultValue: 'SÀN GIAO DỊCH AI VIỆT NAM',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      label: {
        en: 'Subtitle',
        vi: 'Tiêu đề phụ',
      },
      defaultValue: 'Nền tảng giao dịch hàng đầu Việt Nam',
    },
    {
      name: 'items',
      type: 'array',
      label: {
        en: 'Stat items',
        vi: 'Các mục thống kê',
      },
      labels: {
        singular: {
          en: 'Stat item',
          vi: 'Mục thống kê',
        },
        plural: {
          en: 'Stat items',
          vi: 'Các mục thống kê',
        },
      },
      minRows: 1,
      maxRows: 6,
      defaultValue: [
        {
          icon: 'users',
          value: '50.000+',
          label: 'Người dùng dịch vụ',
        },
        {
          icon: 'sale',
          value: '131.878+',
          label: 'Dịch vụ, thiết bị bán',
        },
        {
          icon: 'rent',
          value: '24.146+',
          label: 'Trang thiết bị thuê',
        },
      ],
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: {
            en: 'Icon',
            vi: 'Biểu tượng',
          },
          required: true,
          defaultValue: 'users',
          options: [
            {
              label: {
                en: 'Users',
                vi: 'Người dùng',
              },
              value: 'users',
            },
            {
              label: {
                en: 'Sale',
                vi: 'Bán',
              },
              value: 'sale',
            },
            {
              label: {
                en: 'Rent',
                vi: 'Thuê',
              },
              value: 'rent',
            },
          ],
        },
        {
          name: 'value',
          type: 'text',
          label: {
            en: 'Value',
            vi: 'Giá trị',
          },
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          label: {
            en: 'Label',
            vi: 'Nhãn',
          },
          required: true,
        },
      ],
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: {
        en: 'Button label',
        vi: 'Nhãn nút',
      },
      defaultValue: 'Bắt đầu ngay',
    },
    {
      name: 'buttonUrl',
      type: 'text',
      label: {
        en: 'Button link URL',
        vi: 'Liên kết của nút',
      },
      defaultValue: '/listings',
    },
  ],
}
