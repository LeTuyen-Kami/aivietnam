import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      label: { en: 'Language', vi: 'Ngôn ngữ' },
      options: [
        {
          label: { en: 'Typescript', vi: 'Typescript' },
          value: 'typescript',
        },
        {
          label: { en: 'Javascript', vi: 'Javascript' },
          value: 'javascript',
        },
        {
          label: { en: 'CSS', vi: 'CSS' },
          value: 'css',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
