import type { Block } from 'payload'

const HTML_ID_MAX = 256

/** Safe subset for `document.getElementById` targets (no spaces). Empty is allowed for draft/autosave rows. */
const validateTargetElementId = (value: unknown) => {
  if (value == null || value === '') {
    return true
  }
  if (typeof value !== 'string') {
    return 'Enter a target element id.'
  }
  const id = value.trim()
  if (!id) {
    return true
  }
  if (id.length > HTML_ID_MAX) {
    return `Id must be at most ${HTML_ID_MAX} characters.`
  }
  if (/\s/.test(id)) {
    return 'Id cannot contain spaces.'
  }
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return 'Use only letters, numbers, hyphen, and underscore (valid HTML id subset).'
  }
  return true
}

export const TargetedAdSlot: Block = {
  slug: 'targetedAdSlot',
  dbName: 'tas',
  interfaceName: 'TargetedAdSlotBlock',
  labels: {
    singular: {
      en: 'Ad — DOM target slot',
      vi: 'Quảng cáo — gắn theo id DOM',
    },
    plural: {
      en: 'Ad — DOM target slots',
      vi: 'Quảng cáo — slot theo id DOM',
    },
  },
  fields: [
    {
      name: 'targetElementId',
      type: 'text',
      required: false,
      validate: validateTargetElementId,
      label: {
        en: 'Target element id',
        vi: 'Id phần tử đích',
      },
      admin: {
        description: {
          en: 'Must match an element’s id on this page (client-side). You can leave this empty while drafting; publish only after it is set. Place this block after the target in layout when possible; otherwise the UI will wait for the node to appear.',
          vi: 'Phải trùng thuộc tính id của một phần tử trên trang (phía client). Có thể để trống khi soạn thảo; chỉ xuất bản sau khi đã nhập id. Nên đặt block này sau block chứa phần tử đó trong layout; nếu không, giao diện sẽ chờ node xuất hiện.',
        },
        placeholder: 'sidebar-ad-slot',
      },
    },
    {
      name: 'embedHtml',
      type: 'code',
      label: {
        en: 'HTML',
        vi: 'HTML',
      },
      admin: {
        description: {
          en: 'Markup injected into the target element as normal DOM (portal + slot container).',
          vi: 'HTML được inject vào phần tử đích như DOM thường (portal + container slot).',
        },
        language: 'html',
      },
    },
    {
      name: 'embedCss',
      type: 'code',
      label: {
        en: 'CSS',
        vi: 'CSS',
      },
      admin: {
        description: {
          en: 'Styles for this slot (raw rules or a full <style>…</style> block).',
          vi: 'CSS cho vùng này (rule thuần hoặc cả khối <style>…</style>).',
        },
        language: 'css',
      },
    },
    {
      name: 'embedScript',
      type: 'code',
      label: {
        en: 'Script',
        vi: 'Script',
      },
      admin: {
        description: {
          en: 'JavaScript or third-party snippet (inline or full <script>…</script> tags).',
          vi: 'JavaScript hoặc snippet (inline hoặc cả thẻ <script>…</script>).',
        },
        language: 'javascript',
      },
    },
  ],
}
