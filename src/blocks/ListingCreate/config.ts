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
      label: {
        en: 'Button label',
        vi: 'Nhãn nút',
      },
    },
    {
      name: 'modalTitle',
      type: 'text',
      defaultValue: 'Đăng tin mới',
      required: true,
      label: {
        en: 'Modal title',
        vi: 'Tiêu đề hộp thoại',
      },
    },
    {
      name: 'modalDescription',
      type: 'textarea',
      defaultValue: 'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
      label: {
        en: 'Modal description',
        vi: 'Mô tả hộp thoại',
      },
    },
    {
      name: 'successMessage',
      type: 'text',
      defaultValue: 'Đã gửi tin đăng. Admin sẽ duyệt trước khi tin xuất hiện.',
      label: {
        en: 'Success message',
        vi: 'Thông báo thành công',
      },
    },
  ],
}
