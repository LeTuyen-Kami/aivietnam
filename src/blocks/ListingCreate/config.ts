import type { Block } from 'payload'

export const ListingCreate: Block = {
  slug: 'listingCreate',
  interfaceName: 'ListingCreateBlock',
  labels: {
    singular: {
      en: 'Listing create floating button',
      vi: 'Nút nổi tạo tin đăng',
    },
    plural: {
      en: 'Listing create floating buttons',
      vi: 'Các nút nổi tạo tin đăng',
    },
  },
  fields: [
    {
      name: 'buttonLabel',
      type: 'text',
      defaultValue: 'Đăng tin',
      required: true,
    },
    {
      name: 'modalTitle',
      type: 'text',
      defaultValue: 'Đăng tin mới',
      required: true,
    },
    {
      name: 'modalDescription',
      type: 'textarea',
      defaultValue: 'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
    },
    {
      name: 'successMessage',
      type: 'text',
      defaultValue: 'Đã gửi tin đăng. Admin sẽ duyệt trước khi tin xuất hiện.',
    },
  ],
}
