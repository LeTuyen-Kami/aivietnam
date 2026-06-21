import type { Block, Field } from 'payload'

const makeOrbitCardField = (
  name: string,
  label: string | Record<string, string>,
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
      label: {
        en: 'Title',
        vi: 'Tiêu đề',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required,
      label: {
        en: 'Image',
        vi: 'Hình ảnh',
      },
    },
    {
      name: 'href',
      type: 'text',
      label: {
        en: 'Link',
        vi: 'Liên kết',
      },
      admin: {
        description: {
          en: 'Internal path (e.g. /posts/my-slug) or full URL.',
          vi: 'Đường dẫn nội bộ (vd: /posts/my-slug) hoặc URL đầy đủ.',
        },
      },
    },
  ],
})

const makeCenterLabelField = (
  name: string,
  label: string | Record<string, string>,
  defaultValue: string,
): Field => ({
  name,
  type: 'text',
  label,
  required: true,
  defaultValue,
})

const makeCenterLabelHrefField = (name: string, label: string | Record<string, string>): Field => ({
  name,
  type: 'text',
  label,
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
      label: {
        en: 'Heading',
        vi: 'Tiêu đề',
      },
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
          label: {
            en: 'Center image',
            vi: 'Hình trung tâm',
          },
        },
        {
          name: 'centerImageHref',
          type: 'text',
          label: {
            en: 'Center image link',
            vi: 'Liên kết hình trung tâm',
          },
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
            makeCenterLabelField(
              'centerTopLeftLabel',
              { en: 'Top left label', vi: 'Nhãn trên cùng bên trái' },
              'Tin tức',
            ),
            makeCenterLabelField(
              'centerTopMiddleLabel',
              { en: 'Top middle label', vi: 'Nhãn trên cùng ở giữa' },
              'Giáo dục',
            ),
            makeCenterLabelField(
              'centerTopRightLabel',
              { en: 'Top right label', vi: 'Nhãn trên cùng bên phải' },
              'Nghiên cứu',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelHrefField('centerTopLeftLabelHref', {
              en: 'Top left label link',
              vi: 'Liên kết nhãn trên cùng bên trái',
            }),
            makeCenterLabelHrefField('centerTopMiddleLabelHref', {
              en: 'Top middle label link',
              vi: 'Liên kết nhãn trên cùng ở giữa',
            }),
            makeCenterLabelHrefField('centerTopRightLabelHref', {
              en: 'Top right label link',
              vi: 'Liên kết nhãn trên cùng bên phải',
            }),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField(
              'centerMiddleLeftLabel',
              { en: 'Middle left label', vi: 'Nhãn giữa bên trái' },
              'Ứng dụng',
            ),
            makeCenterLabelField(
              'centerMiddleRightLabel',
              { en: 'Middle right label', vi: 'Nhãn giữa bên phải' },
              'Thương mại',
            ),
            makeCenterLabelField(
              'centerRightUpperLabel',
              { en: 'Right upper label', vi: 'Nhãn phía trên bên phải' },
              'Podcasts',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelHrefField('centerMiddleLeftLabelHref', {
              en: 'Middle left label link',
              vi: 'Liên kết nhãn giữa bên trái',
            }),
            makeCenterLabelHrefField('centerMiddleRightLabelHref', {
              en: 'Middle right label link',
              vi: 'Liên kết nhãn giữa bên phải',
            }),
            makeCenterLabelHrefField('centerRightUpperLabelHref', {
              en: 'Right upper label link',
              vi: 'Liên kết nhãn phía trên bên phải',
            }),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField(
              'centerBottomLeftLabel',
              { en: 'Bottom left label', vi: 'Nhãn dưới cùng bên trái' },
              'Hội thảo',
            ),
            makeCenterLabelField(
              'centerBottomMiddleLabel',
              { en: 'Bottom middle label', vi: 'Nhãn dưới cùng ở giữa' },
              'AI xoá đói tư duy',
            ),
            makeCenterLabelField(
              'centerBottomRightLabel',
              { en: 'Bottom right label', vi: 'Nhãn dưới cùng bên phải' },
              'Video',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelHrefField('centerBottomLeftLabelHref', {
              en: 'Bottom left label link',
              vi: 'Liên kết nhãn dưới cùng bên trái',
            }),
            makeCenterLabelHrefField('centerBottomMiddleLabelHref', {
              en: 'Bottom middle label link',
              vi: 'Liên kết nhãn dưới cùng ở giữa',
            }),
            makeCenterLabelHrefField('centerBottomRightLabelHref', {
              en: 'Bottom right label link',
              vi: 'Liên kết nhãn dưới cùng bên phải',
            }),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelField(
              'centerBottomFarLeftLabel',
              { en: 'Bottom far left label', vi: 'Nhãn dưới cùng ngoài cùng bên trái' },
              'Sàn AI',
            ),
            makeCenterLabelField(
              'centerBottomFarRightLabel',
              { en: 'Bottom far right label', vi: 'Nhãn dưới cùng ngoài cùng bên phải' },
              'Ảnh',
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            makeCenterLabelHrefField('centerBottomFarLeftLabelHref', {
              en: 'Bottom far left label link',
              vi: 'Liên kết nhãn dưới cùng ngoài cùng bên trái',
            }),
            makeCenterLabelHrefField('centerBottomFarRightLabelHref', {
              en: 'Bottom far right label link',
              vi: 'Liên kết nhãn dưới cùng ngoài cùng bên phải',
            }),
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
        makeOrbitCardField(
          'forumCard',
          { en: 'Forum card', vi: 'Thẻ diễn đàn' },
          'Diễn đàn AI Việt Nam',
        ),
        makeOrbitCardField(
          'studyGroupCard',
          { en: 'Study group card', vi: 'Thẻ nhóm học tập' },
          'Cộng đồng học AI nhóm',
        ),
        makeOrbitCardField(
          'policyCard',
          { en: 'Policy card', vi: 'Thẻ chính sách' },
          'Không gian đạo đức & chính sách',
        ),
        makeOrbitCardField(
          'openSourceCard',
          { en: 'Open source card', vi: 'Thẻ mã nguồn mở' },
          'Trung tâm AI mã nguồn mở',
        ),
        makeOrbitCardField(
          'datasetCard',
          { en: 'Dataset card', vi: 'Thẻ dữ liệu' },
          'Kho dữ liệu AI Việt hóa',
        ),
        makeOrbitCardField(
          'libraryCard',
          { en: 'Library card', vi: 'Thẻ thư viện' },
          'Thư viện tài nguyên',
        ),
        makeOrbitCardField(
          'toolsCard',
          { en: 'Tools card', vi: 'Thẻ công cụ' },
          'Bộ công cụ AI phổ biến',
        ),
        makeOrbitCardField(
          'allianceCard',
          { en: 'Alliance card', vi: 'Thẻ liên minh' },
          'Liên minh AI Việt Nam',
        ),
        makeOrbitCardField(
          'mindsetCard',
          { en: 'Mindset card', vi: 'Thẻ tư duy' },
          'Tư duy & Triết lý',
        ),
        makeOrbitCardField(
          'jobsCard',
          { en: 'Jobs card', vi: 'Thẻ việc làm' },
          'Tuyển dụng & Việc làm',
        ),
        makeOrbitCardField(
          'reportsCard',
          { en: 'Reports card', vi: 'Thẻ báo cáo' },
          'Báo cáo & Dữ liệu',
        ),
        makeOrbitCardField(
          'eventsCard',
          { en: 'Events card', vi: 'Thẻ sự kiện' },
          'Lịch sự kiện AI Việt Nam',
        ),
        makeOrbitCardField(
          'startupCard',
          { en: 'Startup card', vi: 'Thẻ khởi nghiệp' },
          'Startup & Đầu tư',
        ),
        makeOrbitCardField(
          'cooperationCard',
          { en: 'Cooperation card', vi: 'Thẻ hợp tác' },
          'Hợp tác Quốc tế',
        ),
        makeOrbitCardField(
          'communityProjectsCard',
          { en: 'Community projects card', vi: 'Thẻ dự án cộng đồng' },
          'Dự án AI cộng đồng',
        ),
      ],
    },
  ],
}
