import type { GeneralSetting } from '@/payload-types'

/** Thông tin chung AI Việt Nam (chỉnh trong Admin → General Settings). */
export function buildGeneralSettingsData(logoMediaId: number): Partial<GeneralSetting> {
  return {
    siteName: 'AI Việt Nam',
    siteDescription: 'AI cho toàn dân - kết nối, chia sẻ, phát triển',
    logo: logoMediaId,
    contact: {
      email: 'hello@aivietnam.vn',
      phone: '0938381100',
      address:
        'Tầng 9, Tòa nhà Diamond Plaza, 34 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
    },
    socialLinks: {
      facebook: 'https://facebook.com/',
      twitter: 'https://x.com/',
      youtube: 'https://youtube.com/',
    },
    footerContent: {
      copyright: '© 2024 - 2025. Toàn bộ bản quyền thuộc AI Việt Nam',
    },
  }
}
