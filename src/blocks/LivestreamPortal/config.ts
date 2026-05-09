import type { Block } from 'payload'

export const LivestreamPortal: Block = {
  slug: 'livestreamPortal',
  interfaceName: 'LivestreamPortalBlock',
  labels: {
    singular: {
      en: 'Livestream portal',
      vi: 'Cổng livestream',
    },
    plural: {
      en: 'Livestream portals',
      vi: 'Các cổng livestream',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: {
        en: 'Heading',
        vi: 'Tiêu đề',
      },
      defaultValue: 'Livestream',
    },
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        vi: 'Mô tả',
      },
      defaultValue: 'Theo dõi phiên đang phát hoặc quản lý phòng livestream nếu bạn là admin.',
    },
    {
      name: 'emptyMessage',
      type: 'text',
      label: {
        en: 'Empty state message',
        vi: 'Thông báo khi chưa có livestream',
      },
      defaultValue: 'Hiện chưa có livestream nào đang phát.',
    },
    {
      name: 'adminListLimit',
      type: 'number',
      label: {
        en: 'Admin list limit',
        vi: 'Số phòng hiển thị cho admin',
      },
      defaultValue: 8,
      min: 1,
      max: 24,
    },
  ],
  graphQL: {
    singularName: 'LivestreamPortalBlock',
  },
}
