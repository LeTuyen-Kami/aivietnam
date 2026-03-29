import type { Block } from 'payload'

export const NewsletterSignup: Block = {
  slug: 'newsletterSignup',
  interfaceName: 'NewsletterSignupBlock',
  labels: {
    singular: {
      en: 'Newsletter signup',
      vi: 'Đăng ký nhận tin',
    },
    plural: {
      en: 'Newsletter signups',
      vi: 'Các khối đăng ký nhận tin',
    },
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description:
          'Tạo form trong Forms với ít nhất một trường Email. Gửi bài sẽ lưu vào Form Submissions (đọc qua MCP Payload: findFormSubmissions).',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: { en: 'Eyebrow line', vi: 'Dòng phụ (icon + text)' },
      defaultValue: 'Read on AIVIETNAM',
    },
    {
      name: 'headline',
      type: 'text',
      label: { en: 'Headline', vi: 'Tiêu đề chính' },
      defaultValue: 'Đừng bỏ lỡ góc nhìn AI quan trọng!',
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', vi: 'Mô tả' },
      defaultValue:
        'AI nóng toàn cầu, sàn giao dịch AI hấp dẫn nhất 24 giờ qua trên AIVIETNAM',
    },
    {
      name: 'emailPlaceholder',
      type: 'text',
      label: { en: 'Email placeholder', vi: 'Placeholder ô email' },
      defaultValue: 'Email',
    },
    {
      name: 'submitLabel',
      type: 'text',
      label: { en: 'Submit button', vi: 'Nút gửi' },
      defaultValue: 'ĐĂNG KÝ',
    },
    {
      name: 'disclaimer',
      type: 'textarea',
      label: { en: 'Disclaimer (plain)', vi: 'Dòng chú thích (thuần text)' },
      defaultValue: '*Khi đăng ký, bạn đồng ý điều khoản của AIVIETNAM',
    },
    {
      name: 'termsUrl',
      type: 'text',
      label: { en: 'Terms link URL', vi: 'URL trang điều khoản' },
      admin: {
        description: 'URL cho từ “điều khoản” (vd. /terms hoặc https://...).',
      },
    },
  ],
  graphQL: {
    singularName: 'NewsletterSignupBlock',
  },
}
