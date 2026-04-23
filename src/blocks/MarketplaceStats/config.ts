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
      defaultValue: 'SÀN GIAO DỊCH AI VIỆT NAM',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'Nền tảng giao dịch hàng đầu Việt Nam',
    },
    {
      name: 'items',
      type: 'array',
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
          required: true,
          defaultValue: 'users',
          options: [
            {
              label: 'Users',
              value: 'users',
            },
            {
              label: 'Sale',
              value: 'sale',
            },
            {
              label: 'Rent',
              value: 'rent',
            },
          ],
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'buttonLabel',
      type: 'text',
      defaultValue: 'Bắt đầu ngay',
    },
    {
      name: 'buttonUrl',
      type: 'text',
      defaultValue: '/listings',
    },
  ],
}
