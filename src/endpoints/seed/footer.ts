import type { Footer } from '@/payload-types'

const L = (label: string, url: string) => ({
  link: {
    type: 'custom' as const,
    label,
    url,
  },
})

/** Default footer matching the public site layout (editable in Payload global `footer`). */
export function buildFooterData(featureImageId?: number | null): Partial<Footer> {
  return {
    categoriesHeading: 'Chuyên mục',
    categoryColumns: [
      {
        links: [
          L('Trang chủ', '/'),
          L('Hội thảo', '/hoi-thao'),
          L('Ứng dụng', '/ung-dung'),
          L('Video', '/video'),
          L('Hình ảnh', '/hinh-anh'),
          L('Podcasts', '/podcasts'),
        ],
      },
      {
        links: [
          L('Tin tức', '/tin-tuc'),
          L('Sàn giao dịch AI', '/san-giao-dich-ai'),
          L('Cộng đồng học AI nhóm', '/cong-dong-hoc-ai-nhom'),
          L('Liên minh AI Việt Nam', '/lien-minh-ai-viet-nam'),
          L('Lịch sự kiện AI Việt Nam', '/lich-su-kien-ai-viet-nam'),
          L('Không gian đạo đức & Chính sách', '/dao-duc-chinh-sach'),
        ],
      },
      {
        links: [
          L('Giáo dục', '/giao-duc'),
          L('Startup & Đầu tư', '/startup-dau-tu'),
          L('Dự AI cộng đồng', '/du-ai-cong-dong'),
          L('Tư duy & Triết lý', '/tu-duy-triet-ly'),
          L('Thư viện tài nguyên', '/thu-vien-tai-nguyen'),
        ],
      },
      {
        links: [
          L('Nghiên cứu', '/nghien-cuu'),
          L('Diễn đàn AI Việt Nam', '/dien-dan-ai-viet-nam'),
          L('Kho dữ liệu AI Việt Nam', '/kho-du-lieu-ai-viet-nam'),
          L('Tuyển dụng & Việc làm', '/tuyen-dung-viec-lam'),
          L('AI xóa đói tư duy', '/ai-xoa-doi-tu-duy'),
        ],
      },
      {
        links: [
          L('Bộ công cụ AI phổ biến', '/bo-cong-cu-ai-pho-bien'),
          L('Trung tâm AI mã nguồn mở', '/trung-tam-ai-ma-nguon-mo'),
          L('Thương mại', '/thuong-mai'),
          L('Báo cáo & Dữ liệu', '/bao-cao-du-lieu'),
          L('Hợp tác Quốc tế', '/hop-tac-quoc-te'),
        ],
      },
    ],
    downloadsTitle: 'Tải ứng dụng',
    appStoreUrl: 'https://apps.apple.com/',
    googlePlayUrl: 'https://play.google.com/store',
    hotlineTitle: 'Đường dây nóng',
    hotlines: [
      {
        label: 'Hà Nội:',
        phone: '0938381100',
        href: 'tel:+84938381100',
      },
      {
        label: 'TP HCM:',
        phone: '0938381100',
        href: 'tel:+84938381100',
      },
    ],
    contactLinksHeading: 'Liên hệ',
    contactLinks: [
      { icon: 'mail', link: { type: 'custom', label: 'Gửi tòa soạn', url: '/gui-toa-soan' } },
      { icon: 'advertising', link: { type: 'custom', label: 'Quảng cáo', url: '/quang-cao' } },
      { icon: 'terms', link: { type: 'custom', label: 'Điều khoản sử dụng', url: '/dieu-khoan' } },
      { icon: 'privacy', link: { type: 'custom', label: 'Chính sách bảo mật', url: '/bao-mat' } },
      { icon: 'cookies', link: { type: 'custom', label: 'Cookies', url: '/cookies' } },
    ],
    ...(featureImageId != null ? { featureImage: featureImageId } : {}),
    brandTitle: 'AI VIỆT NAM',
    brandTagline: 'AI cho toàn dân - kết nối, chia sẻ, phát triển',
    contentResponsibility: 'Chịu trách nhiệm quản lý nội dung: Nguyễn Văn Hợp',
    headquartersLabel: 'Trụ sở chính:',
    headquartersAddress:
      'Địa chỉ: Tầng 9, Tòa nhà Diamond Plaza, 34 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
    phoneLabel: 'Điện thoại:',
    centerPhone: '0938381100',
    centerPhoneHref: 'tel:+84938381100',
    emailLabel: 'Email:',
    centerEmail: 'hello@aivietnam.vn',
    socialHeading: 'Theo dõi AI Việt Nam trên',
    socialFacebook: 'https://facebook.com/',
    socialX: 'https://x.com/',
    socialYoutube: 'https://youtube.com/',
    socialTiktok: 'https://tiktok.com/',
    socialRss: '/rss',
    promoTitle: 'SÀN GIAO DỊCH ĐIỆN TỬ AI VIỆT NAM',
    promoSubtitle: 'Sàn giao dịch nhiều người xem nhất',
    promoHref: '/san-giao-dich-ai',
    licenseLine: 'Thuộc tên miền quốc gia Việt Nam Vnnic cấp giấy phép ngày 16/03/2024',
    copyrightLine: '© 2024 - 2025. Toàn bộ bản quyền thuộc AI Việt Nam',
  }
}
