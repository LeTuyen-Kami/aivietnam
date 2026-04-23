import type { Block, Field } from 'payload'

const makeOrbitCardField = (
  name: string,
  label: string,
  defaultTitle: string,
  required = true,
): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      name: 'title',
      type: 'text',
      required,
      defaultValue: defaultTitle,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required,
    },
    {
      name: 'href',
      type: 'text',
      admin: {
        description: {
          en: 'Internal path (e.g. /posts/my-slug) or full URL.',
          vi: 'Đường dẫn nội bộ (vd: /posts/my-slug) hoặc URL đầy đủ.',
        },
      },
    },
  ],
})

const makeCenterLabelField = (name: string, label: string, defaultValue: string): Field => ({
  name,
  type: 'text',
  label,
  required: true,
  defaultValue,
})

export const AIEcosystemMap: Block = {
  slug: 'aiEcosystemMap',
  interfaceName: 'AIEcosystemMapBlock',
  labels: {
    singular: {
      en: 'AI ecosystem map',
      vi: 'Bản đồ hệ sinh thái AI',
    },
    plural: {
      en: 'AI ecosystem map',
      vi: 'Bản đồ hệ sinh thái AI',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'HỆ SINH THÁI AI VIỆT NAM',
    },
    {
      type: 'collapsible',
      label: {
        en: 'Center visual',
        vi: 'Hình trung tâm',
      },
      fields: [
        {
          name: 'centerImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'centerImageHref',
          type: 'text',
          admin: {
            description: {
              en: 'Optional link for the center image.',
              vi: 'Liên kết tùy chọn cho hình trung tâm.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField('centerTopLeftLabel', 'Top left label', 'Tin tức'),
            makeCenterLabelField('centerTopMiddleLabel', 'Top middle label', 'Giáo dục'),
            makeCenterLabelField('centerTopRightLabel', 'Top right label', 'Nghiên cứu'),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField('centerMiddleLeftLabel', 'Middle left label', 'Ứng dụng'),
            makeCenterLabelField('centerMiddleRightLabel', 'Middle right label', 'Thương mại'),
            makeCenterLabelField('centerRightUpperLabel', 'Right upper label', 'Podcasts'),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField('centerBottomLeftLabel', 'Bottom left label', 'Hội thảo'),
            makeCenterLabelField('centerBottomMiddleLabel', 'Bottom middle label', 'AI xoá đói tư duy'),
            makeCenterLabelField('centerBottomRightLabel', 'Bottom right label', 'Video'),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField('centerBottomFarLeftLabel', 'Bottom far left label', 'Sàn AI'),
            makeCenterLabelField('centerBottomFarRightLabel', 'Bottom far right label', 'Ảnh'),
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: {
        en: 'Orbit items',
        vi: 'Các mục xung quanh',
      },
      fields: [
        makeOrbitCardField('forumCard', 'Forum card', 'Diễn đàn AI Việt Nam'),
        makeOrbitCardField('studyGroupCard', 'Study group card', 'Cộng đồng học AI nhóm'),
        makeOrbitCardField('policyCard', 'Policy card', 'Không gian đạo đức & chính sách'),
        makeOrbitCardField('openSourceCard', 'Open source card', 'Trung tâm AI mã nguồn mở'),
        makeOrbitCardField('datasetCard', 'Dataset card', 'Kho dữ liệu AI Việt hóa'),
        makeOrbitCardField('libraryCard', 'Library card', 'Thư viện tài nguyên'),
        makeOrbitCardField('toolsCard', 'Tools card', 'Bộ công cụ AI phổ biến'),
        makeOrbitCardField('allianceCard', 'Alliance card', 'Liên minh AI Việt Nam'),
        makeOrbitCardField('mindsetCard', 'Mindset card', 'Tư duy & Triết lý'),
        makeOrbitCardField('jobsCard', 'Jobs card', 'Tuyển dụng & Việc làm'),
        makeOrbitCardField('reportsCard', 'Reports card', 'Báo cáo & Dữ liệu'),
        makeOrbitCardField('eventsCard', 'Events card', 'Lịch sự kiện AI Việt Nam'),
        makeOrbitCardField('startupCard', 'Startup card', 'Startup & Đầu tư'),
        makeOrbitCardField('cooperationCard', 'Cooperation card', 'Hợp tác Quốc tế'),
        makeOrbitCardField('communityProjectsCard', 'Community projects card', 'Dự án AI cộng đồng'),
      ],
    },
  ],
}
